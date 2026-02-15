#!/bin/bash
set -e

PROJECT_ID="${1:-}"
REGION="europe-west1"
SERVICE_NAME="trafficgen"
DB_INSTANCE="trafficgen-db"
DB_NAME="trafficgen"
DB_USER="trafficgen_user"
SA_NAME="trafficgen-sa"
REPO_NAME="trafficgen"

if [ -z "$PROJECT_ID" ]; then
    echo "Usage: ./setup-gcp.sh <PROJECT_ID>"
    echo "Example: ./setup-gcp.sh my-trafficgen-prod"
    exit 1
fi

echo "=========================================="
echo "TrafficGen Pro - GCP Setup Script"
echo "=========================================="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Step 1: Enable APIs
echo "[1/8] Enabling APIs..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com \
    --project="$PROJECT_ID"

# Step 2: Create Artifact Registry
echo "[2/8] Creating Artifact Registry..."
gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="TrafficGen Pro Docker Images" \
    --project="$PROJECT_ID" || echo "Repository may already exist"

# Step 3: Create Cloud SQL Instance
echo "[3/8] Creating Cloud SQL instance..."
gcloud sql instances create "$DB_INSTANCE" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --project="$PROJECT_ID" || echo "Instance may already exist"

# Step 4: Create Database and User
echo "[4/8] Creating database and user..."
gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE" --project="$PROJECT_ID" || echo "Database may already exist"

DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 20)}"
gcloud sql users set-password "$DB_USER" \
    --instance="$DB_INSTANCE" \
    --password="$DB_PASSWORD" \
    --project="$PROJECT_ID" || echo "User may already exist"

# Step 5: Create Secrets
echo "[5/8] Creating secrets..."

# JWT Secret
echo -n "$(openssl rand -hex 32)" | gcloud secrets create jwt-secret-key --data-file=- --project="$PROJECT_ID" || echo "Secret jwt-secret-key may already exist"

# DB Password
echo -n "$DB_PASSWORD" | gcloud secrets create db-password --data-file=- --project="$PROJECT_ID" || echo "Secret db-password may already exist"

# Stripe Keys (create placeholder if not set)
echo -n "sk_test_placeholder" | gcloud secrets create stripe-secret-key --data-file=- --project="$PROJECT_ID" || echo "Secret stripe-secret-key may already exist"
echo -n "whsec_placeholder" | gcloud secrets create stripe-webhook-secret --data-file=- --project="$PROJECT_ID" || echo "Secret stripe-webhook-secret may already exist"

# Resend API Key
echo -n "re_placeholder" | gcloud secrets create resend-api-key --data-file=- --project="$PROJECT_ID" || echo "Secret resend-api-key may already exist"

# Step 6: Create Service Account
echo "[6/8] Creating Service Account..."
gcloud iam service-accounts create "$SA_NAME" \
    --display-name="TrafficGen Cloud Run SA" \
    --project="$PROJECT_ID" || echo "Service account may already exist"

# Step 7: Grant Permissions
echo "[7/8] Granting permissions..."

# Cloud SQL Client
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client" > /dev/null

# Secret Manager Access
for SECRET in jwt-secret-key db-password stripe-secret-key stripe-webhook-secret resend-api-key; do
    gcloud secrets add-iam-policy-binding "$SECRET" \
        --member="serviceAccount:${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor" \
        --project="$PROJECT_ID" 2>/dev/null || true
done

# Cloud Build SA permissions
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${PROJECT_ID}@cloudbuild.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" > /dev/null

# Step 8: Deploy Cloud Run Service (Initial)
echo "[8/8] Deploying initial Cloud Run service..."
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --platform managed \
    --service-account "${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --allow-unauthenticated \
    --set-env-vars "CLOUD_SQL_CONNECTION_NAME=${PROJECT_ID}:${REGION}:${DB_INSTANCE},DB_NAME=${DB_NAME},DB_USER=${DB_USER},ALLOWED_ORIGINS=https://${SERVICE_NAME}.a.run.app" \
    --set-secrets "DB_PASSWORD=db-password:latest,JWT_SECRET_KEY=jwt-secret-key:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest" \
    --project="$PROJECT_ID"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Service URL:"
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)")
echo "  $SERVICE_URL"
echo ""
echo "Cloud SQL Connection:"
echo "  ${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
echo ""
echo "Next steps:"
echo "  1. Update stripe-secret-key with your real Stripe key:"
echo "     echo -n 'sk_live_xxx' | gcloud secrets versions add stripe-secret-key --data-file=-"
echo ""
echo "  2. Add resend-api-key with your real Resend key:"
echo "     echo -n 're_xxx' | gcloud secrets versions add resend-api-key --data-file=-"
echo ""
echo "  3. Set allowed origins in Cloud Run:"
echo "     gcloud run services update $SERVICE_NAME --set-env-vars ALLOWED_ORIGINS=https://yourdomain.com"
echo ""
echo "  4. Connect GitHub repository and create Cloud Build trigger for automatic deployments"
echo ""
