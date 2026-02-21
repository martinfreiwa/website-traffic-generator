#!/bin/bash
set -e

# =====================================================
# CONFIGURATION - EDIT THESE VALUES BEFORE DEPLOYING
# =====================================================
PROJECT_ID="traffic-creator-487516"
REGION="europe-west1"
SERVICE_NAME="trafficgen"
DB_INSTANCE="trafficgen-db"
ALLOWED_ORIGINS="https://traffic-creator.com"

# Secret names in Secret Manager
SECRET_DB_PASSWORD="db-password"
SECRET_JWT_SECRET="jwt-secret-key"
SECRET_STRIPE_SECRET="stripe-secret-key"
SECRET_STRIPE_WEBHOOK="stripe-webhook-secret"
SECRET_RESEND_API="resend-api-key"
# =====================================================

echo "=================================================="
echo "DEPLOYING TO GOOGLE CLOUD RUN WITH DB MIGRATION"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region:  $REGION"
echo "=================================================="

# 0. Check if user is logged in
echo "Step 0: Checking GCP authentication..."
gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@" || (echo "ERROR: Not logged in. Run: gcloud auth login" && exit 1)
gcloud config set project $PROJECT_ID

# 1. Configure frontend for production
echo "Step 1: Configuring frontend for production..."
echo "VITE_API_URL=" > frontend/.env.production

# 2. Build Frontend
echo "Step 2: Building frontend..."
cd frontend
npm run build
cd ..

# 3. Clean old static files and copy new build
echo "Step 3: Copying frontend build to backend static folder..."
rm -rf backend/static/assets/*
rm -f backend/static/index.html
rsync -av --delete frontend/dist/ backend/static/

# 4. Run database migration
echo "Step 4: Running database migration on Cloud SQL..."
echo "Updating admin accounts in production database..."

# Get DB password from Secret Manager
DB_PASSWORD=$(gcloud secrets versions access latest --secret="$SECRET_DB_PASSWORD" --project=$PROJECT_ID)

# Create temporary SQL file
cat > /tmp/migration.sql << 'EOF'
-- Demote all other admins to user role
UPDATE users SET role = 'user' WHERE role = 'admin' AND email != 'support@traffic-creator.com';

-- Update support@traffic-creator.com password
-- Password: Admin123! (argon2 hash)
UPDATE users SET password_hash = '$argon2id$v=19$m=65536,t=3,p=4$cy7lXGtNae291zrHOCekNA$RKNJ4dPPiWs79FWxxYk9/PDs/YuLYZm6TfyHzDALvM8' WHERE email = 'support@traffic-creator.com';

-- Verify
SELECT email, role FROM users WHERE role = 'admin';
EOF

# Execute SQL using Cloud SQL Proxy
echo "Starting Cloud SQL Proxy..."
./cloud-sql-proxy $PROJECT_ID:$REGION:$DB_INSTANCE --gcloud-auth --port=5433 &
PROXY_PID=$!
sleep 3

# Run migration
PGPASSWORD=$DB_PASSWORD psql -h 127.0.0.1 -p 5433 -U trafficgen_user -d trafficgen -f /tmp/migration.sql || {
    echo "ERROR: Database migration failed!"
    kill $PROXY_PID 2>/dev/null || true
    exit 1
}

# Cleanup
kill $PROXY_PID 2>/dev/null || true
rm /tmp/migration.sql
echo "Database migration completed!"

# 5. Build and push Docker image to GCR
echo "Step 5: Building and pushing Docker image to GCR..."
gcloud builds submit --project=$PROJECT_ID --tag gcr.io/$PROJECT_ID/$SERVICE_NAME ./backend

# 6. Deploy to Cloud Run from GCR image
echo "Step 6: Deploying to Cloud Run from GCR image..."

# Get secrets from Secret Manager
JWT_SECRET=$(gcloud secrets versions access latest --secret="$SECRET_JWT_SECRET" --project=$PROJECT_ID)
STRIPE_SECRET=$(gcloud secrets versions access latest --secret="$SECRET_STRIPE_SECRET" --project=$PROJECT_ID)
STRIPE_WEBHOOK=$(gcloud secrets versions access latest --secret="$SECRET_STRIPE_WEBHOOK" --project=$PROJECT_ID)
RESEND_API=$(gcloud secrets versions access latest --secret="$SECRET_RESEND_API" --project=$PROJECT_ID)

gcloud run deploy $SERVICE_NAME \
  --project=$PROJECT_ID \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --port=8080 \
  --min-instances=1 \
  --max-instances=3 \
  --set-env-vars=ENVIRONMENT=production,LOG_LEVEL=INFO,ALLOWED_ORIGINS=$ALLOWED_ORIGINS,CLOUD_SQL_CONNECTION_NAME=$PROJECT_ID:$REGION:$DB_INSTANCE,DB_NAME=trafficgen,DB_USER=trafficgen_user \
  --set-secrets=JWT_SECRET_KEY=$SECRET_JWT_SECRET:latest,STRIPE_SECRET_KEY=$SECRET_STRIPE_SECRET:latest,STRIPE_WEBHOOK_SECRET=$SECRET_STRIPE_WEBHOOK:latest,RESEND_API_KEY=$SECRET_RESEND_API:latest

# 7. Update traffic to latest revision
echo "Step 7: Updating traffic to latest revision..."
LATEST_REVISION=$(gcloud beta run revisions list --project=$PROJECT_ID --service=$SERVICE_NAME --region=$REGION --format="value(metadata.name)" | head -1)
echo "Latest revision: $LATEST_REVISION"
gcloud beta run services update-traffic $SERVICE_NAME --project=$PROJECT_ID --region=$REGION --to-revisions=$LATEST_REVISION=100

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --project=$PROJECT_ID --region=$REGION --format="value(status.url)")

echo "=================================================="
echo "DEPLOYMENT SUCCESSFUL!"
echo "URL: $SERVICE_URL"
echo "Admin: support@traffic-creator.com / Admin123!"
echo "=================================================="
