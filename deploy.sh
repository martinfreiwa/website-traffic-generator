#!/bin/bash
set -e

PROJECT_ID="traffic-creator-487516"
REGION="europe-west1"
SERVICE_NAME="trafficgen"

echo "=================================================="
echo "DEPLOYING TO GOOGLE CLOUD RUN"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region:  $REGION"
echo "=================================================="

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

# 4. Deploy to Cloud Run
echo "Step 4: Deploying to Cloud Run..."
gcloud beta run deploy $SERVICE_NAME \
  --source=./backend \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --port=8080 \
  --min-instances=1 \
  --max-instances=3 \
  --set-env-vars=ENVIRONMENT=production,LOG_LEVEL=INFO,ALLOWED_ORIGINS=https://traffic-creator.com

# 5. Update traffic to latest revision
echo "Step 5: Updating traffic to latest revision..."
LATEST_REVISION=$(gcloud beta run revisions list --service=$SERVICE_NAME --region=$REGION --format="value(metadata.name)" | head -1)
echo "Latest revision: $LATEST_REVISION"
gcloud beta run services update-traffic $SERVICE_NAME --region=$REGION --to-revisions=$LATEST_REVISION=100

echo "=================================================="
echo "DEPLOYMENT SUCCESSFUL!"
echo "URL: https://traffic-creator.com"
echo "=================================================="
