const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const testUsers = [
  // The dater who will be matched
  {
    name: "Sarah Johnson",
    phoneNumber: "+15551234567",
    userType: "Dater",
    isAuthenticated: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    stanfordEmail: "sjohnson@stanford.edu",
    isStanfordVerified: true,
    profileData: {
      age: 25,
      gender: "female",
      height: 165,
      year: "Senior",
      interests: ["Art", "Yoga", "Teaching"],
      dateActivities: ["Art galleries", "Yoga classes", "Coffee"],
      photos: ["https://randomuser.me/api/portraits/women/1.jpg"],
      sexuality: "straight",
      city: "Stanford",
      updatedAt: new Date().toISOString(),
    },
    sexuality: "straight",
    friends: [],
    swipingPool: {},
    swipedPool: [],
    matches: {},
  },
  // First matchmaker
  {
    name: "John Smith",
    phoneNumber: "+15551234568",
    userType: "Dater & Match Maker",
    isAuthenticated: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    stanfordEmail: "jsmith@stanford.edu",
    isStanfordVerified: true,
    profileData: {
      age: 26,
      gender: "male",
      height: 180,
      year: "Graduate",
      interests: ["Technology", "Coffee", "Reading"],
      dateActivities: ["Coffee", "Tech meetups", "Book clubs"],
      photos: ["https://randomuser.me/api/portraits/men/1.jpg"],
      sexuality: "straight",
      city: "Stanford",
      updatedAt: new Date().toISOString(),
    },
    sexuality: "straight",
    friends: [],
    swipingPool: {},
    swipedPool: [],
    matches: {},
  },
  // Second matchmaker
  {
    name: "Michael Chen",
    phoneNumber: "+15551234569",
    userType: "Dater & Match Maker",
    isAuthenticated: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    stanfordEmail: "mchen@stanford.edu",
    isStanfordVerified: true,
    profileData: {
      age: 27,
      gender: "male",
      height: 178,
      year: "Graduate",
      interests: ["Music", "Food", "Travel"],
      dateActivities: ["Concerts", "Food tours", "Travel"],
      photos: ["https://randomuser.me/api/portraits/men/2.jpg"],
      sexuality: "straight",
      city: "Stanford",
      updatedAt: new Date().toISOString(),
    },
    sexuality: "straight",
    friends: [],
    swipingPool: {},
    swipedPool: [],
    matches: {},
  },
  // Potential matches for Sarah
  {
    name: "David Rodriguez",
    phoneNumber: "+15551234570",
    userType: "Dater",
    isAuthenticated: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    stanfordEmail: "drodriguez@stanford.edu",
    isStanfordVerified: true,
    profileData: {
      age: 26,
      gender: "male",
      height: 182,
      year: "Graduate",
      interests: ["Music", "Food", "Travel"],
      dateActivities: ["Concerts", "Food tours", "Travel"],
      photos: ["https://randomuser.me/api/portraits/men/3.jpg"],
      sexuality: "straight",
      city: "Stanford",
      updatedAt: new Date().toISOString(),
    },
    sexuality: "straight",
    friends: [],
    swipingPool: {},
    swipedPool: [],
    matches: {},
  },
  {
    name: "James Wilson",
    phoneNumber: "+15551234571",
    userType: "Dater",
    isAuthenticated: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    stanfordEmail: "jwilson@stanford.edu",
    isStanfordVerified: true,
    profileData: {
      age: 27,
      gender: "male",
      height: 185,
      year: "Graduate",
      interests: ["Fitness", "Travel", "Cooking"],
      dateActivities: ["Gym", "Travel", "Cooking classes"],
      photos: ["https://randomuser.me/api/portraits/men/4.jpg"],
      sexuality: "straight",
      city: "Stanford",
      updatedAt: new Date().toISOString(),
    },
    sexuality: "straight",
    friends: [],
    swipingPool: {},
    swipedPool: [],
    matches: {},
  },
];

async function createTestUsers() {
  try {
    let createdCount = 0;

    for (const user of testUsers) {
      // Create a user ID from the name (remove spaces and make lowercase)
      const userId = user.name.replace(/\s+/g, "").toLowerCase();

      await db
        .collection("users")
        .doc(userId)
        .set({
          ...user,
          id: userId,
        });

      createdCount++;
      console.log(
        `Created user ${user.name} (${createdCount}/${testUsers.length})`
      );
    }

    console.log(`\nSuccessfully created ${createdCount} test users`);
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    // Close the Firebase connection
    await admin.app().delete();
  }
}

// Run the function
createTestUsers();
