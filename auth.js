// ============================================================
// CRIMSON DEVIL WORLD — Authentication Module (auth.js)
// ============================================================
// Handles: Sign Up, Login, Logout, Session Persistence,
//          Role Assignment, User Profile creation in Firestore
// ============================================================

import {
  auth, db, storage, ROLES, ROLE_COLORS
} from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc, setDoc, getDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── Toast Notification System ───────────────────────────────────────────────
export function showToast(message, type = "info", duration = 4000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-show"));

  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ─── Create User Profile in Firestore ────────────────────────────────────────
async function createUserProfile(uid, username, email) {
  // HEAD_OWNER check: if username matches C4CRIMSON, assign top role
  const role = username.toUpperCase() === "C4CRIMSON"
    ? ROLES.HEAD_OWNER
    : ROLES.MEMBER;

  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    uid,
    username,
    email,
    role,
    roleColor: ROLE_COLORS[role],
    avatar: null,
    status: "online",
    bio: "",
    joinedAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });

  return role;
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUp(username, email, password) {
  if (!username || username.length < 3) {
    showToast("Username must be at least 3 characters.", "error");
    return false;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: username });
    const role = await createUserProfile(cred.user.uid, username, email);

    showToast(`Welcome to Crimson Devil World, ${username}! Role: ${role}`, "success");
    return true;
  } catch (err) {
    const messages = {
      "auth/email-already-in-use": "Email is already registered.",
      "auth/invalid-email": "Invalid email address.",
      "auth/weak-password": "Password must be at least 6 characters.",
    };
    showToast(messages[err.code] || err.message, "error");
    return false;
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast("Login successful. Welcome back!", "success");
    document.getElementById('dashboard-screen').style.display = 'block';
    document.getElementById('login-screen').style.display = 'none';

    return true;
  } catch (err) {
    const messages = {
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/invalid-credential": "Invalid credentials.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
    };
    showToast(messages[err.code] || err.message, "error");
    return false;
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  try {
    await signOut(auth);
    showToast("You have been logged out.", "info");
    window.location.reload();
  } catch (err) {
    showToast("Logout failed: " + err.message, "error");
  }
}

// ─── Get User Profile from Firestore ─────────────────────────────────────────
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

// ─── Auth State Observer ──────────────────────────────────────────────────────
// Call this on app init. Passes user+profile to callback.
export function onAuthReady(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      callback(user, profile);
    } else {
      callback(null, null);
    }
  });
}

// ─── Role Permission Checker ──────────────────────────────────────────────────
import { ROLE_RANK } from "./firebase-config.js";

export function hasPermission(userRole, requiredRole) {
  return (ROLE_RANK[userRole] || 0) >= (ROLE_RANK[requiredRole] || 0);
}
