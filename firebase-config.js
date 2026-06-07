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
    apiKey: "AIzaSyDsZ_cmsZGAP5w3WVxgpbJ3dCN4HRIxsMc",
    authDomain: "c4crimson.firebaseapp.com",
    projectId: "c4crimson",
    storageBucket: "c4crimson.firebasestorage.app",
    messagingSenderId: "58187881604",
    appId: "1:58187881604:web:9dd3f979e311af7169f6d1",
    measurementId: "G-1G9VVVJS6E"
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
