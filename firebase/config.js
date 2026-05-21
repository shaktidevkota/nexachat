import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace these values with your Firebase web app configuration.
const firebaseConfig = {
  apiKey: "AIzaSyCuztS94wrJTzsqIgZUd-7ORBaZSgdA2x0",
  authDomain: "nexachat-6142a.firebaseapp.com",
  projectId: "nexachat-6142a",
  storageBucket: "nexachat-6142a.firebasestorage.app",
  messagingSenderId: "662692583693",
  appId: "1:662692583693:web:2f45779e04405a51ea3844",
  measurementId: "G-J7492D30B5"
};

export const isFirebaseConfigured = !firebaseConfig.apiKey.includes("YOUR_");

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
