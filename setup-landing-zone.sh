#!/usr/bin/env bash
# ==============================================================================
# Automated GCP Landing Zone & Firebase Setup for ARPL EHS Permit to Work
# Project: prj-aurorealty-ehs-ptw-dev | Region: asia-south1 (Mumbai)
# Zero Dedicated IPs, Pure Serverless Firebase Architecture
# ==============================================================================

set -euo pipefail

PROJECT_ID="prj-aurorealty-ehs-ptw-dev"
REGION="asia-south1"

echo "=========================================================="
echo " ARPL EHS PTW - GCP LANDING ZONE PROVISIONER"
echo " Project: $PROJECT_ID | Region: $REGION"
echo "=========================================================="

echo "[1/7] Setting active GCP project..."
gcloud config set project "$PROJECT_ID"

echo "[2/7] Enabling GCP and Firebase APIs..."
gcloud services enable \
    firebase.googleapis.com \
    firestore.googleapis.com \
    firebasestorage.googleapis.com \
    cloudfunctions.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    eventarc.googleapis.com \
    pubsub.googleapis.com \
    cloudscheduler.googleapis.com \
    secretmanager.googleapis.com \
    identitytoolkit.googleapis.com \
    firebasehosting.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com

echo "[3/7] Creating Service Accounts..."
gcloud iam service-accounts create sa-ehs-functions \
    --display-name="Cloud Functions 2nd Gen Runtime SA" \
    --description="Identity for PTW state machine, PDF compilation, and image compression" \
    2>/dev/null || true

gcloud iam service-accounts create sa-github-deployer \
    --display-name="GitHub Actions CI/CD Deployer SA" \
    --description="Pipeline identity for Firebase and Cloud Functions deployment" \
    2>/dev/null || true

echo "[4/7] Binding IAM roles..."
FUNCTIONS_SA="sa-ehs-functions@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOYER_SA="sa-github-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

for role in roles/datastore.user roles/storage.objectAdmin roles/firebaseauth.admin roles/logging.logWriter; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${FUNCTIONS_SA}" --role="$role" --quiet >/dev/null
done

for role in roles/firebase.admin roles/cloudfunctions.admin roles/iam.serviceAccountUser; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${DEPLOYER_SA}" --role="$role" --quiet >/dev/null
done

echo "[5/7] Provisioning Cloud Firestore Native in ${REGION}..."
gcloud firestore databases create --location="$REGION" --type=firestore-native 2>/dev/null || true
gcloud alpha firestore databases update --database='(default)' --enable-pitr 2>/dev/null || true

echo "[6/7] Creating Cloud Storage Bucket with 24-Hour Lifecycle..."
MEDIA_BUCKET="gs://${PROJECT_ID}-media"
gcloud storage buckets create "$MEDIA_BUCKET" --location="$REGION" --uniform-bucket-level-access 2>/dev/null || true
gcloud storage buckets update "$MEDIA_BUCKET" --lifecycle-file="gcs-lifecycle.json" --quiet 2>/dev/null || true

echo "[7/7] Verifying Firebase project association..."
firebase projects:addfirebase "$PROJECT_ID" 2>/dev/null || true

echo "Landing Zone setup completed successfully!"
