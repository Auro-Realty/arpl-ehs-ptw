# Deployment Guide — Firebase-First Architecture (CONFIRMED)

> **Architecture**: Firebase-First | **Auth**: Email/Password | **Offline**: Enabled | **Scope**: All 10 Permit Types + Sunday Work Tile

## 1. Prerequisites

```bash
# Node.js 18+ required
node --version

# Firebase CLI
npm install -g firebase-tools
firebase --version

# Login to Firebase
firebase login
```

---

## 2. Project Setup

### 2.1 Create Firebase Project
```bash
# Create project via Firebase Console or CLI
firebase projects:create arpl-ehs-production --display-name "ARPL EHS PTW System"

# Select the project
firebase use arpl-ehs-production
```

### 2.2 Initialize Firebase Services
```bash
firebase init

# Select these features:
# [x] Firestore
# [x] Functions
# [x] Hosting
# [x] Storage
# [x] Emulators
```

### 2.3 Enable Firebase Auth (Email/Password — Confirmed)
```bash
# Enable Email/Password authentication in Firebase Console:
# https://console.firebase.google.com/project/arpl-ehs-production/authentication
#
# Steps:
# 1. Navigate to Authentication > Sign-in method
# 2. Enable "Email/Password" provider
# 3. Disable all other providers (Google SSO not required)
```

---

## 3. Project Structure

```
arpl-ehs/
├── firebase.json              # Firebase configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Composite indexes
├── storage.rules              # Storage security rules
├── public/                    # Frontend (Firebase Hosting)
│   ├── index.html             # Main SPA
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js             # Main application
│   │   ├── auth.js            # Firebase Auth integration
│   │   ├── permits.js         # Permit CRUD operations
│   │   ├── approvals.js       # Approval chain engine
│   │   ├── notifications.js   # Notification management
│   │   ├── geofence.js        # GPS and geofence logic
│   │   ├── signatures.js      # Digital signature engine
│   │   ├── pdf.js             # PDF generation (client-side)
│   │   ├── config.js          # APP_CONFIG equivalent
│   │   └── utils.js           # Shared utilities
│   └── assets/
│       └── icons/
├── functions/                 # Cloud Functions
│   ├── package.json
│   ├── index.js               # Function exports
│   ├── src/
│   │   ├── permits.js         # Permit state machine
│   │   ├── approvals.js       # Approval chain logic
│   │   ├── escalation.js      # Escalation scheduler
│   │   ├── notifications.js   # Notification dispatch
│   │   ├── rbac.js            # Role validation
│   │   ├── geofence.js        # Haversine validation
│   │   └── pdf.js             # Server-side PDF generation
│   └── tests/
│       └── *.test.js
└── tests/                     # Existing test suite (adapted)
    └── *.js
```

---

## 4. Environment Configuration

### 4.1 firebase.json
```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000" }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "runtime": "nodejs18"
    }
  ],
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

---

## 5. Deployment Commands

### 5.1 Deploy Everything
```bash
firebase deploy
```

### 5.2 Deploy Individual Services
```bash
# Frontend only
firebase deploy --only hosting

# Cloud Functions only
firebase deploy --only functions

# Firestore rules and indexes only
firebase deploy --only firestore

# Storage rules only
firebase deploy --only storage
```

### 5.3 Deploy with Preview Channel (Staging)
```bash
# Create a preview channel for testing
firebase hosting:channel:deploy staging --expires 7d

# Output: https://arpl-ehs-production--staging-<hash>.web.app
```

---

## 6. Local Development

### 6.1 Start Emulator Suite
```bash
# Start all emulators
firebase emulators:start

# Start with seed data
firebase emulators:start --import=./seed-data --export-on-exit=./seed-data
```

### 6.2 Emulator URLs
| Emulator | URL |
|---|---|
| Hosting | http://localhost:5000 |
| Emulator UI | http://localhost:4000 |
| Firestore | http://localhost:8080 |
| Auth | http://localhost:9099 |
| Functions | http://localhost:5001 |
| Storage | http://localhost:9199 |

### 6.3 Connect Frontend to Emulators
```javascript
// In app.js, detect emulator mode
if (location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

---

## 7. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - run: cd functions && npm ci && npm test

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: arpl-ehs-production
          channelId: pr-${{ github.event.number }}
          expires: 7d

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      
      # 1. Build and Deploy Cloud Run Core Backend API
      - id: auth
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: |
          gcloud builds submit --tag asia-south1-docker.pkg.dev/arpl-ehs-production/containers/arpl-ehs-api:${{ github.sha }} ./api
          gcloud run deploy arpl-ehs-api \
            --image asia-south1-docker.pkg.dev/arpl-ehs-production/containers/arpl-ehs-api:${{ github.sha }} \
            --region asia-south1 \
            --platform managed \
            --allow-unauthenticated \
            --concurrency 80 \
            --min-instances 0 \
            --max-instances 10 \
            --set-secrets="FIREBASE_ADMIN_KEY=projects/arpl-ehs-production/secrets/firebase-admin-key:latest"

      # 2. Deploy Firebase Hosting, Firestore Rules & Storage Rules
      - uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting,firestore,storage,functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

---

## 8. Multi-Environment Setup (DEV vs. PROD)

### 8.1 Create Multiple Firebase Projects
```bash
# Development
firebase projects:create arpl-ehs-dev
# Staging
firebase projects:create arpl-ehs-staging
# Production
firebase projects:create arpl-ehs-production
```

### 8.2 Configure Aliases
```bash
firebase use --add
# Alias: dev     -> arpl-ehs-dev
# Alias: staging -> arpl-ehs-staging
# Alias: prod    -> arpl-ehs-production
```

### 8.3 Switch Environments
```bash
firebase use dev      # Development
firebase use staging  # Staging
firebase use prod     # Production
```

---

## 9. Monitoring and Alerts

### 9.1 Firebase Console
- Authentication: Monitor active users, sign-in methods
- Firestore: Usage metrics, read/write counts, storage
- Functions: Invocation count, error rate, latency
- Hosting: Bandwidth, requests

### 9.2 Cloud Monitoring Alerts
```bash
# Set up alert for function errors
gcloud monitoring policies create \
  --display-name="Cloud Functions Error Rate" \
  --condition-display-name="Error rate > 1%" \
  --condition-filter='resource.type="cloud_function" AND metric.type="cloudfunctions.googleapis.com/function/execution_count"'
```

---

## 10. Backup and Recovery

### 10.1 Automated Firestore Backups
```bash
# Export Firestore to Cloud Storage
gcloud firestore export gs://arpl-ehs-backups/$(date +%Y%m%d)

# Schedule daily backups via Cloud Scheduler
gcloud scheduler jobs create http firestore-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/arpl-ehs-production/databases/(default):exportDocuments" \
  --http-method=POST \
  --message-body='{"outputUriPrefix":"gs://arpl-ehs-backups"}'
```

### 10.2 Restore from Backup
```bash
gcloud firestore import gs://arpl-ehs-backups/20260924
```

---

## 11. Initial Data Seed

### 11.1 Create Admin User (First User — Bootstrap)
```bash
# The very first admin user must be created via Firebase Admin SDK script
# This user will then create all other users via the Admin dashboard
node scripts/create-admin.js \
  --email admin@arpl.com \
  --password <secure-password> \
  --displayName "System Administrator" \
  --org "ARPL"

# This script:
# 1. Creates Firebase Auth user with email/password
# 2. Sets custom claims: { role: 'admin', projectIds: ['PRJ-AGR', 'PRJ-ABP', 'PRJ-ART'] }
# 3. Creates Firestore users/{uid} document
```

### 11.2 Seed Projects (GPS Geofence Registry)
```bash
node scripts/seed-projects.js
# Creates 3 pre-configured enterprise project sites:
# - PRJ-AGR: Auro Grand Residency (17.4239°N, 78.4738°E, 150m radius)
# - PRJ-ABP: Auro Business Park (17.4483°N, 78.3915°E, 200m radius)
# - PRJ-ART: Auro Riverside Towers (17.3850°N, 78.4867°E, 100m — unconfigured)
```

### 11.3 Create All 16 Role Users (Admin Pre-Assignment)
```bash
# Admin creates all operational users with role and project assignments
# Users CANNOT self-register or self-select projects
node scripts/seed-users.js

# Creates users for all 16 roles:
# Initiators: Site Supervisor, Electrician, Blasting In-charge, Lifting Supervisor
# Engineers: Site Engineer, MEP Engineer, P&M Engineer, IT Engineer, Quality Engineer
# Section Heads: Excavation Head, Tower Incharge, Project Manager
# EHS: EHS Manager, EHS Officer
# Special: Night Site Supervisor, Administrator
#
# Each user is assigned to specific projects via projectIds[]
# Custom claims are set automatically for RBAC enforcement
```

### 11.4 Seed Demo Permits (All 10 Types)
```bash
node scripts/seed-permits.js
# Creates sample permits across ALL 10 types + Sunday Work variants:
# - PTW-001 Excavation (Active, with 3-way parallel gate clearance)
# - PTW-002 Hot Work (Pending Section Head, with fire watch declaration)
# - PTW-003 Guard Rail (Draft, with void protection checklist)
# - PTW-004 Confined Space (Active, with gas readings: O2/LEL/CO/H2S)
# - PTW-005 Shaft Work (Closed, with scaffold tag verification)
# - PTW-006 Electrical Site (Active, with LOTO fields)
# - PTW-006 Electrical BP (Pending Quality Engineer)
# - PTW-007 Drilling & Blasting (Active, with PESO declaration)
# - PTW-008 General Work (Expired, with housekeeping certification)
# - PTW-009A Routine Lifting (Active, with sling stress calculation)
# - PTW-009B Critical Lift Plan (Pending Project Manager)
# - PTW-010 Night Shift (Active, with dual-phase handover)
# - Sunday Work tagged permits (sundayWork: true, originTile: 'SUN')
```

### 11.5 Verify Offline Persistence
```bash
# After seeding, verify offline persistence works:
# 1. Open app in browser
# 2. Login as any role
# 3. Navigate to dashboard and permit register
# 4. Disconnect network (DevTools > Network > Offline)
# 5. Verify permits and notifications are still visible from IndexedDB cache
# 6. Create a draft permit while offline
# 7. Reconnect network
# 8. Verify draft syncs to Firestore automatically
```
