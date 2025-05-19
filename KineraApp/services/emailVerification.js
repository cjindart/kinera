import { auth, db } from '../utils/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send a verification code to a Stanford email
 * 
 * @param {string} email Stanford email address to verify
 * @returns {Promise<Object>} Result with success status and verification ID
 */
export const sendVerificationEmail = async (email) => {
  try {
    // Validate email format
    if (!/^[a-zA-Z0-9._%+-]+@stanford\.edu$/.test(email)) {
      return { 
        success: false, 
        error: 'Invalid Stanford email address'
      };
    }

    // Ensure the user is authenticated
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'User is not authenticated'
      };
    }

    // Generate a verification code
    const verificationCode = generateVerificationCode();

    // In a real production app, you would:
    // 1. Send an email with the verification code (using Firebase Cloud Functions or a backend)
    // 2. Store the verification code, email, timestamp in Firestore

    // For this demo, we'll just store it in Firestore and return the code for testing
    const verificationData = {
      userId: auth.currentUser.uid,
      email,
      code: verificationCode,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)), // 15-minute expiration
      verified: false
    };

    // Store in Firestore
    const emailVerificationsRef = collection(db, 'emailVerifications');
    const docRef = await addDoc(emailVerificationsRef, verificationData);

    console.log(`Verification code for ${email}: ${verificationCode}`);
    console.log('Verification document created with ID:', docRef.id);

    // In development, we'll return the code for testing
    // In production, remove this and send the code via email
    return {
      success: true,
      verificationId: docRef.id,
      // Remove this in production:
      verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification email'
    };
  }
};

/**
 * Verify a Stanford email with a verification code
 * 
 * @param {string} verificationId ID of the verification document
 * @param {string} code Verification code
 * @returns {Promise<Object>} Result with success status
 */
export const verifyEmailCode = async (verificationId, code) => {
  try {
    // Ensure the user is authenticated
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'User is not authenticated'
      };
    }

    // Fetch the verification document
    const verificationRef = doc(db, 'emailVerifications', verificationId);
    const verificationDoc = await getDoc(verificationRef);

    if (!verificationDoc.exists()) {
      return {
        success: false,
        error: 'Verification not found'
      };
    }

    const verificationData = verificationDoc.data();

    // Check if verification is for the current user
    if (verificationData.userId !== auth.currentUser.uid) {
      return {
        success: false,
        error: 'Unauthorized verification attempt'
      };
    }

    // Check if verification has expired
    const expiresAt = verificationData.expiresAt.toDate();
    if (expiresAt < new Date()) {
      return {
        success: false,
        error: 'Verification code has expired'
      };
    }

    // Check the code
    if (verificationData.code !== code) {
      return {
        success: false,
        error: 'Invalid verification code'
      };
    }

    // Update the verification document
    await setDoc(verificationRef, {
      verified: true,
      verifiedAt: serverTimestamp()
    }, { merge: true });

    // Update the user's profile with the verified email
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userRef, {
      stanfordEmail: verificationData.email,
      isStanfordVerified: true,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return {
      success: true,
      email: verificationData.email
    };
  } catch (error) {
    console.error('Error verifying email code:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify email'
    };
  }
};

/**
 * Get verification status for a user's Stanford email
 * 
 * @returns {Promise<Object>} Verification status
 */
export const getStanfordEmailStatus = async () => {
  try {
    // Ensure the user is authenticated
    if (!auth.currentUser) {
      return {
        verified: false,
        email: null,
        error: 'User is not authenticated'
      };
    }

    // Get the user document
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        verified: false,
        email: null
      };
    }

    const userData = userDoc.data();

    return {
      verified: userData.isStanfordVerified || false,
      email: userData.stanfordEmail || null
    };
  } catch (error) {
    console.error('Error getting Stanford email status:', error);
    return {
      verified: false,
      email: null,
      error: error.message || 'Failed to get email status'
    };
  }
}; 