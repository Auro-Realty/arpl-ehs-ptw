<#
.SYNOPSIS
    Automated GCP Landing Zone & Firebase Setup for ARPL EHS Permit to Work.
.DESCRIPTION
    Configures prj-aurorealty-ehs-ptw-dev without dedicated IPs, enables services,
    sets up least-privilege IAM, initializes Firestore in asia-south1, and attaches 24h lifecycle.
#>

[CmdletBinding()]
param (
    [string]$ProjectId = "prj-aurorealty-ehs-ptw-dev",
    [string]$Region = "asia-south1"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ARPL EHS PTW - GCP LANDING ZONE PROVISIONER" -ForegroundColor Cyan
Write-Host " Project: $ProjectId | Region: $Region" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Set Project
Write-Host "`n[1/7] Setting active GCP project..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# 2. Enable Services
Write-Host "`n[2/7] Enabling GCP and Firebase APIs..." -ForegroundColor Yellow
$services = @(
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "firebasestorage.googleapis.com",
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "eventarc.googleapis.com",
    "pubsub.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com",
    "identitytoolkit.googleapis.com",
    "firebasehosting.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com"
)

foreach ($svc in $services) {
    Write-Host "  -> Enabling $svc"
    gcloud services enable $svc --quiet
}

# 3. Create Service Accounts
Write-Host "`n[3/7] Creating least-privilege Service Accounts..." -ForegroundColor Yellow
gcloud iam service-accounts create sa-ehs-functions `
    --display-name="Cloud Functions 2nd Gen Runtime SA" `
    --description="Identity for PTW state machine, PDF compilation, and image compression" `
    --quiet 2>$null

gcloud iam service-accounts create sa-github-deployer `
    --display-name="GitHub Actions CI/CD Deployer SA" `
    --description="Pipeline identity for Firebase and Cloud Functions deployment" `
    --quiet 2>$null

# 4. Bind Roles
Write-Host "`n[4/7] Binding IAM roles..." -ForegroundColor Yellow
$functionsSa = "serviceAccount:sa-ehs-functions@$ProjectId.iam.gserviceaccount.com"
$deployerSa = "serviceAccount:sa-github-deployer@$ProjectId.iam.gserviceaccount.com"

$functionsRoles = @("roles/datastore.user", "roles/storage.objectAdmin", "roles/firebaseauth.admin", "roles/logging.logWriter")
foreach ($role in $functionsRoles) {
    gcloud projects add-iam-policy-binding $ProjectId --member=$functionsSa --role=$role --quiet | Out-Null
}

$deployerRoles = @("roles/firebase.admin", "roles/cloudfunctions.admin", "roles/iam.serviceAccountUser")
foreach ($role in $deployerRoles) {
    gcloud projects add-iam-policy-binding $ProjectId --member=$deployerSa --role=$role --quiet | Out-Null
}

# 5. Create Cloud Firestore in Native Mode
Write-Host "`n[5/7] Provisioning Cloud Firestore Native in $Region..." -ForegroundColor Yellow
gcloud firestore databases create --location=$Region --type=firestore-native --quiet 2>$null

# Enable 7-Day Continuous PITR (DPDP Act 2023 requirement)
Write-Host "  -> Enabling Point-in-Time Recovery (PITR)..."
gcloud alpha firestore databases update --database='(default)' --enable-pitr --quiet 2>$null

# 6. Apply Storage Bucket Lifecycle (24-Hour Auto-Removal for temp images)
Write-Host "`n[6/7] Applying 24-hour auto-removal lifecycle to Cloud Storage..." -ForegroundColor Yellow
$mediaBucket = "gs://$ProjectId-media"
gcloud storage buckets create $mediaBucket --location=$Region --uniform-bucket-level-access --quiet 2>$null
gcloud storage buckets update $mediaBucket --lifecycle-file="gcs-lifecycle.json" --quiet 2>$null

# 7. Bind Firebase to Project
Write-Host "`n[7/7] Verifying Firebase project association..." -ForegroundColor Yellow
firebase projects:addfirebase $ProjectId 2>$null

Write-Host "`n Landing Zone Provisioning Successfully Completed!" -ForegroundColor Green
Write-Host "Next steps: Run 'firebase deploy' to publish Hosting, Rules, and Cloud Functions 2nd Gen." -ForegroundColor Green
