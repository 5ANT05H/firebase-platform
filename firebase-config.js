// ============================================================
// CRIMSON DEVIL WORLD — Firebase Configuration
// ============================================================
// HOW TO CONNECT YOUR FIREBASE PROJECT:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or open existing one)
// 3. Click the </> (Web) icon to register your app
// 4. Copy the firebaseConfig object from Firebase and paste below
// 5. In Firebase Console → Authentication → Sign-in method → Enable "Email/Password"
// 6. In Firebase Console → Firestore Database → Create database (start in test mode initially)
// 7. In Firebase Console → Storage → Get started
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ─── REPLACE THIS OBJECT WITH YOUR FIREBASE CONFIG ───────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyBKpXQ9MWJ-6a1NSnKlhrLdxXfu8i6BYkE",
    authDomain: "crimson-devil-world.firebaseapp.com",
    databaseURL: "https://crimson-devil-world-default-rtdb.firebaseio.com",
    projectId: "crimson-devil-world",
    storageBucket: "crimson-devil-world.firebasestorage.app",
    messagingSenderId: "625125480692",
    appId: "1:625125480692:web:a13a13488fab88532c66a1",
    measurementId: "G-Z2JEB3TCFN"
  };
// ─────────────────────────────────────────────────────────────────────────────

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable session persistence (user stays logged in after page refresh)
setPersistence(auth, browserLocalPersistence).catch(console.error);

// ─── ROLE HIERARCHY ───────────────────────────────────────────────────────────
// Roles are stored in Firestore under users/{uid}.role
// HEAD_OWNER is locked to the username "C4CRIMSON" — set manually in Firestore
export const ROLES = {
  HEAD_OWNER: "HEAD_OWNER",
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
};

// Role rank for permission comparisons (higher = more access)
export const ROLE_RANK = {
  HEAD_OWNER: 4,
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

// Role display colors (CSS variable names or hex)
export const ROLE_COLORS = {
  HEAD_OWNER: "#ff0000",
  OWNER: "#ff6600",
  ADMIN: "#ff4488",
  MEMBER: "#aaaaaa",
};

export { app, auth, db, storage };
