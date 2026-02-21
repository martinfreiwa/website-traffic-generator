#!/bin/bash
set -e

PROJECT_ID="traffic-creator-487516"
REGION="europe-west1"

echo "=================================================="
echo "SETTING UP GCP INFRASTRUCTURE FOR WORKER"
echo "Project: $PROJECT_ID"
echo "Region:  $REGION"
echo "=================================================="

# 1. Create Pub/Sub topic if it doesn't exist
echo "Step 1: Creating Pub/Sub topic..."
gcloud pubsub topics create traffic-generation-tasks 2>/dev/null || echo "Topic already exists"

# 2. Create Pub/Sub subscription if it doesn't exist
echo "Step 2: Creating Pub/Sub subscription..."
gcloud pubsub subscriptions create traffic-workers-sub \
  --topic=traffic-generation-tasks \
  --ack-deadline=300 \
  --message-retention-duration=604800s \
  2>/dev/null || echo "Subscription already exists"

# 3. Create internal-api-key secret if it doesn't exist
echo "Step 3: Creating internal-api-key secret..."
API_KEY=$(openssl rand -hex 32)
if gcloud secrets describe internal-api-key &>/dev/null; then
    echo "Secret already exists, adding new version..."
    echo -n "$API_KEY" | gcloud secrets versions add internal-api-key --data-file=-
else
    echo "Creating new secret..."
    echo -n "$API_KEY" | gcloud secrets create internal-api-key --data-file=-
fi
echo "Internal API Key: $API_KEY"
echo "IMPORTANT: Save this key! You'll need it for local development."

# 4. Grant API service account permission to publish to Pub/Sub
echo "Step 4: Granting Pub/Sub publisher role to API service..."
API_SA="service-$PROJECT_ID@gcp-sa-cloudrun.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$API_SA" \
  --role="roles/pubsub.publisher" 2>/dev/null || echo "IAM binding may already exist"

# 5. Grant worker service account permission to subscribe
echo "Step 5: Granting Pub/Sub subscriber role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$API_SA" \
  --role="roles/pubsub.subscriber" 2>/dev/null || echo "IAM binding may already exist"

echo ""
echo "=================================================="
echo "INFRASTRUCTURE SETUP COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Deploy the API service: ./deploy.sh"
echo "2. Deploy the worker service: ./deploy-worker.sh"
echo "=================================================="
