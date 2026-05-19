import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  getDocs 
} from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase.config';

// Initialize Firebase
let app = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.warn('Firebase initialization skipped:', error.message);
}

// Function to generate face vector from detection data
export const generateFaceVector = (detection) => {
  if (!detection || !detection.descriptor) {
    throw new Error('Invalid face detection data');
  }
  return Array.from(detection.descriptor);
};

// Function to calculate similarity between two vectors
export const calculateSimilarity = (vector1, vector2) => {
  try {
    if (!Array.isArray(vector1) || !Array.isArray(vector2)) {
      throw new Error('Vectors must be arrays');
    }

    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must be of same length');
    }

    const processedVector1 = vector1.map(val => Number(val));
    const processedVector2 = vector2.map(val => Number(val));
    
    const hasInvalidValues = [...processedVector1, ...processedVector2].some(val => isNaN(val));
    if (hasInvalidValues) {
      throw new Error('Invalid vector values');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < processedVector1.length; i++) {
      const v1 = processedVector1[i];
      const v2 = processedVector2[i];
      
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    const similarity = dotProduct / (norm1 * norm2);
    return Math.max(0, Math.min(1, similarity));
  } catch (error) {
    console.error('Error in calculateSimilarity:', error);
    throw error;
  }
};

// Function to generate secure UUID v4
const generateSecureUUID = () => {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: Generate UUID v4 manually using crypto.getRandomValues()
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    
    // Set version (4) and variant bits according to RFC 4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    
    // Convert to UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  
  // Last resort fallback (not cryptographically secure, should rarely be used)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Function to store face vector in Firebase
export const storeFaceVector = async (faceVector, userId = null) => {
  if (!db) {
    console.warn('Firebase is not available, skipping face vector storage');
    return { success: false, uuid: userId || null };
  }
  
  try {
    if (!Array.isArray(faceVector)) {
      throw new Error('Invalid face vector format');
    }

    // Use provided userId (UUID) or generate new one
    const userUUID = userId || generateSecureUUID();
    const timestamp = new Date().toISOString();
    
    const faceVectorsRef = collection(db, 'faceVectors');
    
    const docRef = await addDoc(faceVectorsRef, {
      vector: faceVector,
      timestamp: timestamp,
      userId: userUUID, // Store the UUID here
      uuid: userUUID    // Also store in uuid field for consistency
    });

    console.log('Successfully stored face vector with UUID:', userUUID);
    console.log('Document ID:', docRef.id);
    
    return { 
      success: true, 
      uuid: userUUID,  // Return the UUID for reference
      docId: docRef.id 
    };
  } catch (error) {
    console.error('Error storing face vector:', error);
    return { success: false, uuid: userId || null };
  }
};

export const checkExistingFaceVector = async (faceVector) => {
  try {
    if (!Array.isArray(faceVector)) {
      throw new Error('Invalid face vector format');
    }

    console.log('Checking for existing face vector via backend API...');
    
    // Call secure backend route instead of downloading database
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/face/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ faceVector })
    });

    if (!response.ok) {
      console.warn('Backend face verification failed, falling back...');
      return null;
    }

    const data = await response.json();
    
    if (data.match) {
      console.log('Face match found via backend API. Zone:', data.zone);
      // Pass bioToken and zone through to the caller
      return { ...data.match, bioToken: data.bioToken || null, zone: data.zone || null };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking existing face vector:', error);
    return null;
  }
};

// Function to store user profile data in Firebase
export const storeUserProfile = async (uuid, profileData) => {
  if (!db) {
    console.warn('Firebase is not available, skipping user profile storage');
    return { success: false };
  }
  
  try {
    const { setDoc, doc } = await import('firebase/firestore');
    const docRef = doc(db, 'users', uuid);
    
    await setDoc(docRef, {
      uuid: uuid,
      profile: {
        fullName: profileData.fullName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        organization: profileData.organization || '',
        role: profileData.role || '',
        location: profileData.location || ''
      },
      account: {
        plan: 'basic',
        credits: 0,
        status: profileData.fullName && profileData.email ? 'active' : 'pending',
        createdAt: new Date().toISOString(),
        completedAt: profileData.fullName && profileData.email ? new Date().toISOString() : null
      },
      scans: [],
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('Successfully stored user profile for UUID:', uuid);
    
    return { 
      success: true, 
      docId: uuid 
    };
  } catch (error) {
    console.error('Error storing user profile:', error);
    return { success: false };
  }
};

// Function to get user profile data from Firebase by UUID
export const getUserProfile = async (uuid) => {
  if (!db) {
    console.warn('Firebase is not available, skipping user profile retrieval');
    return { success: false, user: null };
  }
  
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    
    // First, try the standard way: getting the document by its ID
    const docRef = doc(db, 'users', uuid);
    const docSnap = await getDoc(docRef);
    
    let mainUser = null;
    if (docSnap.exists()) {
      mainUser = docSnap.data();
    }
    
    // Fallback: search for older documents created with addDoc (where ID != uuid but field uuid == uuid)
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    const querySnapshot = await getDocs(q);
    
    let fallbackUser = null;
    for (const d of querySnapshot.docs) {
      if (d.data().uuid === uuid && d.id !== uuid) {
        fallbackUser = d.data();
        break;
      }
    }
    
    if (mainUser || fallbackUser) {
      // Merge them. PlanSelection writes to mainUser (ID=uuid), Identity wrote to fallbackUser.
      // So mainUser has 'plan', fallbackUser has 'profile'.
      const mergedUser = { ...fallbackUser, ...mainUser };
      console.log('Found and merged user profile for UUID:', uuid);
      return { 
        success: true, 
        user: mergedUser,
        docId: uuid
      };
    }
    
    console.log('No user profile found for UUID:', uuid);
    return { success: false, user: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, user: null };
  }
};

// Function to update user profile data in Firebase
export const updateUserProfile = async (uuid, profileData) => {
  if (!db) {
    console.warn('Firebase is not available, skipping user profile update');
    return { success: false };
  }
  
  try {
    const { setDoc, doc } = await import('firebase/firestore');
    const docRef = doc(db, 'users', uuid);
    
    await setDoc(docRef, {
      profile: profileData,
      account: {
        status: 'active',
        completedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('Successfully updated user profile for UUID:', uuid);
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false };
  }
};
