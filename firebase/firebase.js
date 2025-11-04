import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJhj5qw3odWjaRxYrSsFBX8bppopVOD54",
  authDomain: "appbdgsbg-26846956-157ae.firebaseapp.com",
  projectId: "appbdgsbg-26846956-157ae",
  storageBucket: "appbdgsbg-26846956-157ae.firebasestorage.app",
  messagingSenderId: "417707230437",
  appId: "1:417707230437:web:7470b7d3bb4a5bad7cc00c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
