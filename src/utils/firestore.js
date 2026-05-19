import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase.config';

// Initialize Firebase
let app;
let db;

try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully for Firestore');
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase instance for Firestore');
  }
  
  db = getFirestore(app);
  console.log('Firestore initialized successfully');
} catch (error) {
  console.error('Firestore initialization error:', error);
}

/**
 * Save user profile data to Firestore
 * @param {string} userId - The authenticated user's UID
 * @param {object} profileData - User profile information
 * @returns {Promise<object>} Result object with success status and message
 */
export const saveUserProfile = async (userId, profileData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    
    const dataToSave = {
      fullName: profileData.fullName || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      organization: profileData.organization || '',
      role: profileData.role || '',
      location: profileData.location || '',
      updatedAt: serverTimestamp(),
      profileComplete: true
    };

    // Check if document exists
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(userRef, dataToSave);
      console.log('User profile updated successfully');
    } else {
      // Create new document with createdAt timestamp
      await setDoc(userRef, {
        ...dataToSave,
        createdAt: serverTimestamp()
      });
      console.log('User profile created successfully');
    }

    return {
      success: true,
      message: 'Profile saved successfully',
      data: dataToSave
    };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return {
      success: false,
      message: error.message || 'Failed to save profile',
      error: error
    };
  }
};

/**
 * Get user profile data from Firestore
 * @param {string} userId - The authenticated user's UID
 * @returns {Promise<object>} Result object with user profile data
 */
export const getUserProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log('User profile retrieved successfully');
      return {
        success: true,
        data: userData,
        exists: true
      };
    } else {
      console.log('No user profile found');
      return {
        success: true,
        data: null,
        exists: false,
        message: 'No profile found for this user'
      };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      success: false,
      message: error.message || 'Failed to get profile',
      error: error
    };
  }
};

/**
 * Update specific fields in user profile
 * @param {string} userId - The authenticated user's UID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Result object with success status
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    console.log('User profile updated successfully');
    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      message: error.message || 'Failed to update profile',
      error: error
    };
  }
};

/**
 * Check if user profile is complete
 * @param {string} userId - The authenticated user's UID
 * @returns {Promise<object>} Result object with completion status
 */
export const checkProfileCompletion = async (userId) => {
  try {
    const result = await getUserProfile(userId);
    
    if (!result.success || !result.exists) {
      return {
        success: true,
        isComplete: false,
        percentage: 0
      };
    }

    const profile = result.data;
    const requiredFields = ['fullName', 'email', 'phone', 'organization', 'role', 'location'];
    const completedFields = requiredFields.filter(field => profile[field] && profile[field].trim() !== '');
    
    const percentage = Math.round((completedFields.length / requiredFields.length) * 100);

    return {
      success: true,
      isComplete: percentage === 100,
      percentage: percentage,
      completedFields: completedFields,
      missingFields: requiredFields.filter(field => !completedFields.includes(field))
    };
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return {
      success: false,
      message: error.message || 'Failed to check profile completion',
      error: error
    };
  }
};

/**
 * Search users by email (for admin purposes)
 * @param {string} email - Email to search for
 * @returns {Promise<object>} Result object with user data
 */
export const getUserByEmail = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: true,
        data: null,
        exists: false,
        message: 'No user found with this email'
      };
    }

    const userData = querySnapshot.docs[0].data();
    const userId = querySnapshot.docs[0].id;

    return {
      success: true,
      data: { ...userData, userId },
      exists: true
    };
  } catch (error) {
    console.error('Error searching user by email:', error);
    return {
      success: false,
      message: error.message || 'Failed to search user',
      error: error
    };
  }
};

export { db };
