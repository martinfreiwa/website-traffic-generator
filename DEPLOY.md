# Deployment Guide

This document describes how to deploy TrafficGen Pro to Google Cloud Run.

## Prerequisites

- Docker Desktop installed and running
- gcloud CLI authenticated (`gcloud auth login`)
- Project set: `gcloud config set project traffic-creator-487516`

## Quick Deploy

Run these commands in sequence:

```bash
# 1. Build image for amd64 (required for Cloud Run)
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker build --platform linux/amd64 -t trafficgen:latest .

# 2. Tag for Artifact Registry
docker tag trafficgen:latest europe-west1-docker.pkg.dev/traffic-creator-487516/trafficgen/trafficgen:latest

# 3. Push to Artifact Registry
docker push europe-west1-docker.pkg.dev/traffic-creator-487516/trafficgen/trafficgen:latest

# 4. Deploy to Cloud Run
gcloud run deploy trafficgen \
  --image europe-west1-docker.pkg.dev/traffic-creator-487516/trafficgen/trafficgen:latest \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances traffic-creator-487516:europe-west1:trafficgen-db \
  --set-env-vars "DB_USER=trafficgen_user,DB_NAME=trafficgen,ALLOWED_ORIGINS=https://traffic-creator.com,CLOUD_SQL_CONNECTION_NAME=traffic-creator-487516:europe-west1:trafficgen-db" \
  --set-secrets "DB_PASSWORD=db-password:latest,JWT_SECRET_KEY=jwt-secret-key:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,RESEND_API_KEY=resend-api-key:latest"
```

## Notes

- **Platform flag:** Must use `--platform linux/amd64` because Cloud Run doesn't support ARM
- **First-time setup:** Ensure secrets exist in Secret Manager (`db-password`, `jwt-secret-key`, `stripe-secret-key`, `resend-api-key`)
- **Artifact Registry:** Run `gcloud auth configure-docker europe-west1-docker.pkg.dev` if you get auth errors

## URLs

- **Service:** https://trafficgen-307389561330.europe-west1.run.app
- **Cloud Console:** https://console.cloud.google.com/run/detail/europe-west1/trafficgen
