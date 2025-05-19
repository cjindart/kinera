const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function clearAllFriends() {
  try {
    const usersSnapshot = await db.collection("users").get();
    let clearedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      await userDoc.ref.update({
        friends: [],
      });
      clearedCount++;
      console.log(
        `Cleared friends for user ${userDoc.id} (${clearedCount}/${usersSnapshot.size})`
      );
    }

    console.log(`\nSuccessfully cleared friends for ${clearedCount} users`);
  } catch (error) {
    console.error("Error clearing friends:", error);
  } finally {
    // Close the Firebase connection
    await admin.app().delete();
  }
}

// Run the function
clearAllFriends();
