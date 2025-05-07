import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../utils/firebase';

// Helper to check if we're in development mode with dummy Firebase config
const isDevelopmentMode = () => {
  return (
    firebaseConfig.apiKey === "YOUR_API_KEY" || 
    !firebaseConfig.apiKey || 
    firebaseConfig.apiKey.includes("YOUR_")
  );
};

/**
 * Activity model class to handle date activity data and operations
 */
class Activity {
  /**
   * Create a new activity instance
   * @param {Object} activityData - Activity data object
   */
  constructor(activityData = {}) {
    this.id = activityData.id || null;
    this.name = activityData.name || '';
    this.description = activityData.description || '';
    this.location = activityData.location || '';
    this.availableTimes = activityData.availableTimes || [];
    this.createdBy = activityData.createdBy || null; // User ID of creator
    this.createdAt = activityData.createdAt || new Date();
    this.updatedAt = activityData.updatedAt || new Date();
  }

  /**
   * Save activity data to Firestore
   */
  async save() {
    try {
      // Generate ID if not exists
      if (!this.id) {
        this.id = `activity_${Date.now()}`;
      }
      
      // Skip Firestore operations in development mode
      if (isDevelopmentMode()) {
        console.log("Development mode: Skipping Firestore save for activity");
        return true;
      }
      
      const activityRef = doc(db, "activities", this.id);
      await setDoc(activityRef, this.toFirestore(), { merge: true });
      
      return true;
    } catch (error) {
      console.error("Error saving activity data:", error);
      return false;
    }
  }

  /**
   * Convert activity object to Firestore format
   * @returns {Object} Firestore-formatted activity data
   */
  toFirestore() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      location: this.location,
      availableTimes: this.availableTimes,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  /**
   * Fetch activity data from Firestore by ID
   * @param {string} activityId - Activity ID
   * @returns {Activity} Activity instance or null if not found
   */
  static async fetchById(activityId) {
    try {
      // Skip Firestore in development mode
      if (isDevelopmentMode()) {
        console.log("Development mode: Skipping Firestore fetchById for activity");
        return null;
      }
      
      const activityRef = doc(db, "activities", activityId);
      const activityDoc = await getDoc(activityRef);
      
      if (activityDoc.exists()) {
        const activityData = activityDoc.data();
        return new Activity(activityData);
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching activity:", error);
      return null;
    }
  }

  /**
   * Fetch activities created by a specific user
   * @param {string} userId - User ID
   * @returns {Array<Activity>} Array of Activity instances
   */
  static async fetchByUser(userId) {
    try {
      // Skip Firestore in development mode
      if (isDevelopmentMode()) {
        console.log("Development mode: Skipping Firestore fetchByUser for activities");
        return [];
      }
      
      const activitiesQuery = query(
        collection(db, "activities"), 
        where("createdBy", "==", userId)
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push(new Activity(doc.data()));
      });
      
      return activities;
    } catch (error) {
      console.error("Error fetching activities by user:", error);
      return [];
    }
  }

  /**
   * Fetch all available activities
   * @returns {Array<Activity>} Array of Activity instances
   */
  static async fetchAll() {
    try {
      // Skip Firestore in development mode
      if (isDevelopmentMode()) {
        console.log("Development mode: Skipping Firestore fetchAll for activities");
        return [];
      }
      
      const querySnapshot = await getDocs(collection(db, "activities"));
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push(new Activity(doc.data()));
      });
      
      return activities;
    } catch (error) {
      console.error("Error fetching all activities:", error);
      return [];
    }
  }

  /**
   * Delete an activity from Firestore
   * @returns {boolean} Success status
   */
  async delete() {
    try {
      if (!this.id) return false;
      
      // Skip Firestore in development mode
      if (isDevelopmentMode()) {
        console.log("Development mode: Skipping Firestore delete for activity");
        return true;
      }
      
      await deleteDoc(doc(db, "activities", this.id));
      return true;
    } catch (error) {
      console.error("Error deleting activity:", error);
      return false;
    }
  }
}

export default Activity; 