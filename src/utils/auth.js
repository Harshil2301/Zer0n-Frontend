import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { firebaseConfig } from '../config/firebase.config';

// Initialize Firebase
let app;
let auth;

try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully for authentication');
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase instance for authentication');
  }
  
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Google Authentication
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      }
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
};

// Email/Password Registration
export const registerWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send email verification
    await sendEmailVerification(user);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      },
      message: 'Verification email sent! Please check your inbox.'
    };
  } catch (error) {
    console.error('Email registration error:', error);
    
    let errorMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered. Please sign in instead.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters.';
        break;
      default:
        errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode: error.code
    };
  }
};

// Email/Password Sign In
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      }
    };
  } catch (error) {
    console.error('Email sign-in error:', error);
    
    let errorMessage = 'Sign in failed. Please try again.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled.';
        break;
      default:
        errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode: error.code
    };
  }
};

// Resend Email Verification
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        error: 'No user is currently signed in.'
      };
    }
    
    if (user.emailVerified) {
      return {
        success: false,
        error: 'Email is already verified.'
      };
    }
    
    await sendEmailVerification(user);
    
    return {
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    };
  } catch (error) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Sign Out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return {
      success: true
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Listen to authentication state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        isAuthenticated: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        }
      });
    } else {
      callback({
        isAuthenticated: false,
        user: null
      });
    }
  });
};

// Get current user
export const getCurrentUser = () => {
  const user = auth.currentUser;
  
  if (user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
  }
  
  return null;
};

export { auth };
