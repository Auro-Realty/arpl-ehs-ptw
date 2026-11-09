/**
 * Seed Projects & Super Admin in Firestore
 * Usage: node seed-projects.js
 */

const admin = require("firebase-admin");
const projects = require("../public/config.projects.json");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "prj-aurorealty-ehs-ptw-dev"
  });
}

const db = admin.firestore();

async function seed() {
  console.log("Seeding Projects to Firestore...");
  for (const proj of projects) {
    await db.collection("projects").doc(proj.id).set({
      ...proj,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`✓ Seeded project: ${proj.name} (${proj.id})`);
  }

  // Create Initial Super Admin in Auth if not exists
  const superAdminEmail = "aic1176@aurogroup.com";
  try {
    let user;
    try {
      user = await admin.auth().getUserByEmail(superAdminEmail);
      console.log(`Super Admin user already exists (${superAdminEmail}): ${user.uid}`);
      await admin.auth().updateUser(user.uid, {
        password: "Auro@12345"
      });
    } catch (e) {
      user = await admin.auth().createUser({
        email: superAdminEmail,
        password: "Auro@12345",
        displayName: "ARPL Super Administrator (AIC1176)"
      });
      console.log(`Created Super Admin user (${superAdminEmail}): ${user.uid}`);
    }

    await admin.auth().setCustomUserClaims(user.uid, {
      superAdmin: true,
      role: "super-admin"
    });

    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: superAdminEmail,
      displayName: "ARPL Super Administrator (AIC1176)",
      role: "super-admin",
      superAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✓ Super Admin ${superAdminEmail} custom claims and profile seeded successfully.`);
  } catch (err) {
    console.error(`Super Admin seeding error for ${superAdminEmail}:`, err);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error seeding:", err);
  process.exit(1);
});
