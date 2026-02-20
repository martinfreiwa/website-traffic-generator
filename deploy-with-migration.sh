#!/bin/bash
set -e

PROJECT_ID="traffic-creator-487516"
REGION="europe-west1"
SERVICE_NAME="trafficgen"
DB_INSTANCE="traffic-creator"

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
echo "Step 3: Cleaning old static files and copying new build..."
rm -rf backend/static/assets/*
rm -f backend/static/index.html
rsync -av --delete frontend/dist/ backend/static/

# 4. Run database migration
echo "Step 4: Running database migration on Cloud SQL..."
echo "Updating admin accounts in production database..."

# Get DB password from Secret Manager
DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password" --project=$PROJECT_ID)

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

# Execute SQL using Cloud SQL Proxy or gcloud sql
echo "Connecting to Cloud SQL..."
gcloud sql connect $DB_INSTANCE --database=trafficgen --user=trafficgen_user < /tmp/migration.sql || {
    echo "ERROR: Database migration failed!"
    echo "You may need to run the migration manually:"
    echo "  gcloud sql connect $DB_INSTANCE --database=trafficgen --user=trafficgen_user"
    echo ""
    cat /tmp/migration.sql
    exit 1
}

rm /tmp/migration.sql
echo "Database migration completed!"

# 5. Deploy to Cloud Run
echo "Step 5: Deploying to Cloud Run..."
gcloud beta run deploy $SERVICE_NAME \
  --source=./backend \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --port=8080 \
  --min-instances=1 \
  --max-instances=3 \
  --set-env-vars=ENVIRONMENT=production,LOG_LEVEL=INFO,ALLOWED_ORIGINS=https://traffic-creator.com,RESEND_API_KEY=YOUR_RESEND_API_KEY,STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY

# 6. Update traffic to latest revision
echo "Step 6: Updating traffic to latest revision..."
LATEST_REVISION=$(gcloud beta run revisions list --service=$SERVICE_NAME --region=$REGION --format="value(metadata.name)" | head -1)
echo "Latest revision: $LATEST_REVISION"
gcloud beta run services update-traffic $SERVICE_NAME --region=$REGION --to-revisions=$LATEST_REVISION=100

echo "=================================================="
echo "DEPLOYMENT SUCCESSFUL!"
echo "URL: https://traffic-creator.com"
echo "Admin: support@traffic-creator.com / Admin123!"
echo "=================================================="
