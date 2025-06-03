const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
const serviceAccount = require(path.join(
  __dirname,
  "../../vouch-e7830-firebase-adminsdk-fbsvc-ca4e7cfc57.json"
));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateAllUsersSexuality() {
  try {
    console.log("🔄 Starting to update all users' sexuality...");

    // Get all users from Firestore
    const usersSnapshot = await db.collection("users").get();

    console.log(`📊 Found ${usersSnapshot.size} users to update`);

    // Update each user
    const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
      await userDoc.ref.update({
        sexuality: "straight",
        "profileData.sexuality": "straight",
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Updated user ${userDoc.id}`);
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    console.log("🎉 Successfully updated all users' sexuality to 'straight'");
  } catch (error) {
    console.error("❌ Error updating users:", error);
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run the update
updateAllUsersSexuality();
