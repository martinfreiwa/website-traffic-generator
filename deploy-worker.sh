#!/bin/bash
set -e

PROJECT_ID="traffic-creator-487516"
REGION="europe-west1"
SERVICE_NAME="trafficgen-worker"
API_SERVICE="trafficgen"

echo "=================================================="
echo "DEPLOYING WORKER TO GOOGLE CLOUD RUN"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region:  $REGION"
echo "=================================================="

# Get the API service URL
echo "Step 1: Getting API service URL..."
API_URL=$(gcloud run services describe $API_SERVICE --region=$REGION --format='value(status.url)')
echo "API URL: $API_URL"

# Build using Cloud Build
echo "Step 2: Building worker image with Cloud Build..."
gcloud builds submit \
  --config=cloudbuild-worker.yaml \
  --timeout=600s \
  .

# Deploy the worker service
echo "Step 3: Deploying worker service..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region=$REGION \
  --no-allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --port=8080 \
  --min-instances=1 \
  --max-instances=20 \
  --concurrency=80 \
  --timeout=600 \
  --set-env-vars=API_URL=$API_URL,GCP_PROJECT_ID=$PROJECT_ID,PUBSUB_SUBSCRIPTION=traffic-workers-sub,USE_PUBSUB=true,MAX_CONCURRENT_TASKS=20 \
  --set-secrets=INTERNAL_API_KEY=internal-api-key:latest

# Grant Pub/Sub subscriber permissions
echo "Step 4: Granting Pub/Sub permissions..."
WORKER_SA=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || echo "")

if [ -n "$WORKER_SA" ]; then
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:$WORKER_SA" \
      --role="roles/pubsub.subscriber" 2>/dev/null || echo "IAM binding may already exist"
else
    echo "Note: Using default service account"
fi

echo "=================================================="
echo "DEPLOYMENT SUCCESSFUL!"
echo "Worker Service: $SERVICE_NAME"
echo "=================================================="