const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function clearAllUsers() {
  try {
    // Get all users
    const usersSnapshot = await db.collection("users").get();

    // Counter for tracking progress
    let deletedCount = 0;

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userRef = db.collection("users").doc(userDoc.id);

      // Delete the user document
      await userRef.delete();

      deletedCount++;
      console.log(
        `Deleted user ${userDoc.id} (${deletedCount}/${usersSnapshot.size})`
      );
    }

    console.log(`\nSuccessfully deleted ${deletedCount} users`);
  } catch (error) {
    console.error("Error deleting users:", error);
  } finally {
    // Close the Firebase connection
    await admin.app().delete();
  }
}

// Run the function
clearAllUsers();
