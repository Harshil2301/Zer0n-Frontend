// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgVgmLXExFLBmGy8NV9lIxMae3TpBHsf4",
  authDomain: "zer0n-43a3c.firebaseapp.com",
  projectId: "zer0n-43a3c",
  storageBucket: "zer0n-43a3c.firebasestorage.app",
  messagingSenderId: "1001471158137",
  appId: "1:1001471158137:web:38028a16d16b289dda71a8",
  measurementId: "G-Z7084TNXRP"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = app.name ? getAnalytics(app) : null;

// Initialize Firestore
export const db = getFirestore(app)

export default app