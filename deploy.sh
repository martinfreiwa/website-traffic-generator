#!/bin/bash
set -e

PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="traffic-gen-pro"
REGION="us-central1"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "=================================================="
echo "DEPLOYING TO GOOGLE CLOUD RUN"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region:  $REGION"
echo "=================================================="

# 1. Create Production Env Config for Frontend (Force relative/same-origin API)
echo "Step 1: Configuring frontend for production build..."
# Setting VITE_API_URL to empty string ensures the frontend code uses window.location.origin
echo "VITE_API_URL=" > frontend/.env.production

# 2. Build Frontend
echo "Step 2: Building frontend..."
cd frontend
# Installing dependencies just in case
npm install --legacy-peer-deps
npm run build
cd ..

# 3. Prepare Backend Static Files
echo "Step 3: Copying frontend build to backend/static..."
# Ensure clean slate
rm -rf backend/static
mkdir -p backend/static
# Copy build artifacts
cp -r frontend/dist/* backend/static/

# 4. Build and Submit Container
echo "Step 4: Building and pushing container to Container Registry..."
cd backend
gcloud builds submit --tag $IMAGE_TAG .

# 5. Deploy to Cloud Run
echo "Step 5: Deploying service to Cloud Run..."
# Note: We set a default secret key. You should update this in the Cloud Console for security.
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars JWT_SECRET_KEY="prod_secret_key_generated_during_deploy",ACCESS_TOKEN_EXPIRE_MINUTES="1440"

echo "=================================================="
echo "DEPLOYMENT SUCCESSFUL!"
echo "Your service should be live shortly."
echo "=================================================="
