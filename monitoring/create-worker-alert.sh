#!/bin/bash
set -e

PROJECT_ID="traffic-creator-487516"
NOTIFICATION_EMAIL="${1:-support@traffic-creator.com}"

echo "Creating Cloud Monitoring alert for worker inactivity..."

cat <<EOF > /tmp/worker-alert-policy.json
{
  "displayName": "Worker Inactivity Alert",
  "documentation": {
    "content": "The trafficgen-worker service appears to be inactive. Check worker logs for errors. The subscriber may have crashed and needs restart.",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "Worker health check returning 503",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"trafficgen-worker\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\"",
        "aggregations": [
          {
            "alignmentPeriod": "300s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM",
            "groupByFields": ["resource.labels.service_name"]
          }
        ],
        "comparison": "COMPARISON_GT",
        "thresholdValue": 0.01,
        "duration": "600s",
        "trigger": {
          "count": 2
        }
      }
    }
  ],
  "combiner": "OR",
  "alertStrategy": {
    "autoClose": "3600s"
  },
  "enabled": true
}
EOF

gcloud alpha monitoring policies create \
  --project=$PROJECT_ID \
  --policy-from-file=/tmp/worker-alert-policy.json

echo ""
echo "Alert policy created!"
echo ""
echo "NOTE: To receive email notifications, you need to:"
echo "1. Create a notification channel in Cloud Console:"
echo "   https://console.cloud.google.com/monitoring/alerting/notifications"
echo ""
echo "2. Add the notification channel to this policy via the console"
echo ""
echo "Alternative: Use the gcloud command below to create an email channel and link it:"
echo "  gcloud beta monitoring channels create --type=email --display-name='Support Email' --channel-labels=email_address=$NOTIFICATION_EMAIL"
