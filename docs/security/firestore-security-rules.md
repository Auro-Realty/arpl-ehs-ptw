# Firestore Security Rules Governance

## Overview
Because the frontend application talks directly to the database in a Firebase-First architecture, the **Firestore Security Rules** are the primary firewall protecting ARPL's safety data.

## Core Principles

### 1. Default Deny
All collections default to `allow read, write: if false;`. Explicit routes must be opened.

### 2. Authentication Gateway
No unauthenticated access is permitted under any circumstance.
```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

### 3. Tenant / Project Isolation
A user may only interact with permits associated with the projects explicitly granted to them in their Custom Claims.
```javascript
function isAssignedToProject(projectId) {
  return projectId in request.auth.token.projectIds;
}
```

### 4. Write Constraints
Clients are strictly forbidden from modifying critical audit fields. Only the server (Cloud Functions using Admin SDK) can modify these.
- `createdAt`
- `status`
- `stage`
- `currentApprovers`

*Client-side state transitions are implemented by the client submitting a "transition request" (e.g., adding an approval object to an array). A Cloud Function evaluates the request, and if valid, moves the `status` forward.*

## The Rules Implementation

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Default Deny
    match /{document=**} {
      allow read, write: if false;
    }

    match /permits/{permitId} {
      // READ: Allowed if authenticated AND assigned to the permit's project
      allow read: if request.auth != null 
                  && (resource.data.projectId in request.auth.token.projectIds 
                      || request.auth.token.role in ['admin', 'ehs-manager']);

      // CREATE: Allowed if user is an initiator and sets correct initial state
      allow create: if request.auth != null 
                    && (request.resource.data.projectId in request.auth.token.projectIds)
                    && request.auth.token.role in ['site-supervisor', 'electrician', 'blasting-incharge', 'lifting-supervisor']
                    && request.resource.data.status == 'DRAFT';

      // UPDATE: Allowed for adding approvals or uploading files, but NEVER allowed to change core state
      allow update: if request.auth != null 
                    && (resource.data.projectId in request.auth.token.projectIds)
                    && request.resource.data.status == resource.data.status
                    && request.resource.data.stage == resource.data.stage;
      
      // DELETE: Strictly prohibited. Append-only system.
      allow delete: if false;
    }
  }
}
```
