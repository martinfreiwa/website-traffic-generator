#!/bin/bash
set -e

PROJECT_ID="traffic-creator-487516"
REGION="europe-west1"
SERVICE_NAME="trafficgen"
DB_INSTANCE="trafficgen-db"

echo "Warte auf Cloud SQL Bereitschaft..."

# Warten bis Cloud SQL bereit ist
for i in {1..30}; do
    STATE=$(gcloud sql instances describe $DB_INSTANCE --project=$PROJECT_ID --format="value(state)" 2>/dev/null || echo "UNKNOWN")
    echo "Cloud SQL Status: $STATE"
    if [ "$STATE" = "RUNNABLE" ]; then
        echo "Cloud SQL ist bereit!"
        break
    fi
    sleep 10
done

# Datenbank erstellen
echo "Erstelle Datenbank..."
gcloud sql databases create trafficgen --instance=$DB_INSTANCE --project=$PROJECT_ID 2>/dev/null || echo existiert bereits"

# User erstellen
echo "Erstelle User "Datenbank..."
gcloud sql users set-password trafficgen_user \
    --instance=$DB_INSTANCE \
    --password="TrafficGen2026!" \
    --project=$PROJECT_ID 2>/dev/null || echo "User existiert bereits"

# IAM Berechtigungen
echo "Setze IAM Berechtigungen..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:trafficgen-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client" 2>/dev/null || echo "IAM bereits gesetzt"

# Secrets Berechtigungen
for SECRET in jwt-secret-key db-password stripe-secret-key stripe-webhook-secret resend-api-key; do
    gcloud secrets add-iam-policy-binding $SECRET \
        --member="serviceAccount:trafficgen-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor" \
        --project=$PROJECT_ID 2>/dev/null || true
done

echo "Cloud SQL Setup abgeschlossen!"
echo ""
echo "Verbindungsname: ${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
