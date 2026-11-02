# Local Testing via Firebase Emulator Suite

## Overview
To prevent incurring cloud costs and polluting the production database during development and QA, the ARPL PTW system relies entirely on the **Firebase Local Emulator Suite**.

## Prerequisites
- Node.js (18+)
- Java (Required for Firestore Emulator)
- Firebase CLI (`npm install -g firebase-tools`)

## Setup Instructions

1. **Initialize the Emulator**:
   From the project root:
   ```bash
   firebase init emulators
   ```
   Select Firestore, Functions, Auth, and Storage.

2. **Run the Emulator Suite**:
   ```bash
   firebase emulators:start
   ```
   This boots the local suite. The Emulator UI is typically accessible at `http://localhost:4000`.

3. **Configure the Frontend**:
   The `index.html` file includes initialization logic to detect `localhost` and automatically route SDK traffic to the emulators:
   ```javascript
   if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
       firebase.firestore().useEmulator("localhost", 8080);
       firebase.auth().useEmulator("http://localhost:9099");
       firebase.storage().useEmulator("localhost", 9199);
       firebase.functions().useEmulator("localhost", 5001);
   }
   ```

## Testing Offline Mode
The emulator is the perfect environment for testing the offline-first capabilities:
1. Open the app on `localhost`.
2. Open Chrome DevTools > Network tab.
3. Check the "Offline" throttling profile.
4. Fill out a permit and submit. Verify the UI updates immediately.
5. Uncheck "Offline".
6. Verify in the Emulator UI (`http://localhost:4000/firestore`) that the document has synced.

## Seeding Test Data
Use the admin API or a dedicated seed script to inject the 16 test users into the Auth emulator and seed the `config` documents into Firestore upon emulator start.
