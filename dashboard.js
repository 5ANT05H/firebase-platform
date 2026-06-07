// ============================================================
// CRIMSON DEVIL WORLD — Dashboard Module (dashboard.js)
// ============================================================
// Features: Role-gated chats, announcements, notifications,
//           voice channels UI, live listeners, banner slider
// ============================================================

import { db, ROLES, ROLE_COLORS } from "./firebase-config.js";
import { onAuthReady, logout, hasPermission, showToast } from "./auth.js";

import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, doc, updateDoc,
  getDocs, deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let currentProfile = null;
let activeChannel = "public";
let chatUnsubscribe = null;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── Init ─────────────────────────────────────────────────────────────────────
export function initDashboard() {
  onAuthReady((user, profile) => {
    if (!user || !profile) {
      showAuthScreen();
      return;
    }
    currentUser = user;
    currentProfile = profile;
    showDashboard();
    setupUserHeader();
    setupSidebar();
    setupChannels();
    loadAnnouncements();
    initBannerSlider();
    startNotificationListener();
  });
}

// ─── Screen Switchers ─────────────────────────────────────────────────────────
function showAuthScreen() {
  $("auth-screen").style.display = "flex";
  $("dashboard-screen").style.display = "none";
}

function showDashboard() {
  ("auth-screen").style.display = "none";
  ("dashboard-screen").style.display = "flex";
}

// ─── User Header Setup ────────────────────────────────────────────────────────
function setupUserHeader() {
  const { username, role, roleColor, avatar } = currentProfile;

  $("header-username").textContent = username;
  $("header-role").textContent = role.replace("_", " ");
  $("header-role").style.color = roleColor;

  if (avatar) {
    $("header-avatar").src = avatar;
  }

  $("logout-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) logout();
  });
}

// ─── Sidebar & Channel List ───────────────────────────────────────────────────
function setupSidebar() {
  // Mobile sidebar toggle
  $("sidebar-toggle")?.addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
  });
}

// ─── Channel Access Control ───────────────────────────────────────────────────
const CHANNEL_PERMISSIONS = {
  public: ROLES.MEMBER,
  admin: ROLES.ADMIN,
  owner: ROLES.OWNER,
  headowner: ROLES.HEAD_OWNER,
};

function setupChannels() {
  const channelItems = document.querySelectorAll(".channel-item[data-channel]");
  const role = currentProfile.role;

  channelItems.forEach((item) => {
    const channel = item.dataset.channel;
    const required = CHANNEL_PERMISSIONS[channel];

    if (!hasPermission(role, required)) {
      item.classList.add("locked");
      item.title = `Requires ${required} role`;
      item.addEventListener("click", () => {
        showToast(`Access denied. Requires ${required} role.`, "error");
      });
    } else {
      item.addEventListener("click", () => switchChannel(channel, item));
    }
  });

  // Default to public
  switchChannel("public", document.querySelector('[data-channel="public"]'));
}

function switchChannel(channel, el) {
  activeChannel = channel;

  document.querySelectorAll(".channel-item").forEach((i) => i.classList.remove("active"));
  el?.classList.add("active");

  $("chat-channel-name").textContent = `# ${channel}`;

  if (chatUnsubscribe) chatUnsubscribe();
  loadChat(channel);
}

// ─── Real-time Chat ───────────────────────────────────────────────────────────
function loadChat(channel) {
  const messagesEl = $("chat-messages");
  messagesEl.innerHTML = '<div class="chat-loading">Loading messages…</div>';

  const q = query(
    collection(db, `chats/${channel}/messages`),
    orderBy("createdAt", "asc"),
    limit(100)
  );

  chatUnsubscribe = onSnapshot(q, (snap) => {
    messagesEl.innerHTML = "";
    snap.forEach((d) => renderMessage(d.data(), messagesEl));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

function renderMessage(data, container) {
  const el = document.createElement("div");
  el.className = "chat-message";

  const time = data.createdAt?.toDate
    ? data.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "…";

  el.innerHTML = `
    <div class="msg-avatar">
      <img src="${data.avatar || "assets/default-avatar.png"}" alt="">
    </div>
    <div class="msg-body">
      <div class="msg-header">
        <span class="msg-name" style="color:${data.roleColor || '#fff'}">${escHtml(data.username)}</span>
        <span class="msg-role-badge" style="background:${data.roleColor}22;color:${data.roleColor}">${data.role}</span>
        <span class="msg-time">${time}</span>
      </div>
      <div class="msg-text">${escHtml(data.text)}</div>
    </div>
  `;
  container.appendChild(el);
}

// ─── Send Message ─────────────────────────────────────────────────────────────
export async function sendMessage() {
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text || !currentProfile) return;

  const { username, role, roleColor, avatar } = currentProfile;

  try {
    await addDoc(collection(db, `chats/${activeChannel}/messages`), {
      text,
      username,
      role,
      roleColor,
      avatar: avatar || null,
      uid: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    input.value = "";
  } catch (err) {
    showToast("Failed to send message: " + err.message, "error");
  }
}

// ─── Announcements ────────────────────────────────────────────────────────────
async function loadAnnouncements() {
  const container = $("announcements-list");
  if (!container) return;

  container.innerHTML = '<div class="loading-spin"></div>';

  try {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(10));
    const snap = await getDocs(q);

    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = '<p class="empty-state">No announcements yet.</p>';
      return;
    }

    snap.forEach((d) => {
      const data = d.data();
      const el = document.createElement("div");
      el.className = "announcement-card";
      el.innerHTML = `
        <div class="ann-header">
          <span class="ann-icon">📢</span>
          <span class="ann-author" style="color:${data.roleColor}">${escHtml(data.author)}</span>
          <span class="ann-time">${formatRelTime(data.createdAt?.toDate())}</span>
        </div>
        <div class="ann-title">${escHtml(data.title)}</div>
        <div class="ann-body">${escHtml(data.body)}</div>
      `;
      container.appendChild(el);
    });
  } catch {
    container.innerHTML = '<p class="empty-state">Failed to load announcements.</p>';
  }
}

// POST announcement (ADMIN+)
export async function postAnnouncement(title, body) {
  if (!hasPermission(currentProfile.role, ROLES.ADMIN)) {
    showToast("Insufficient permissions.", "error");
    return;
  }

  try {
    await addDoc(collection(db, "announcements"), {
      title,
      body,
      author: currentProfile.username,
      role: currentProfile.role,
      roleColor: currentProfile.roleColor,
      uid: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    showToast("Announcement posted!", "success");
    loadAnnouncements();
  } catch (err) {
    showToast("Failed to post announcement: " + err.message, "error");
  }
}

// ─── Live Notification Listener ───────────────────────────────────────────────
function startNotificationListener() {
  const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  let first = true;
  onSnapshot(q, (snap) => {
    if (first) { first = false; return; } // skip initial load
    snap.docChanges().forEach((change) => {
      if (change.type === "added") {
        const d = change.doc.data();
        if (!d.targetRole || hasPermission(currentProfile.role, d.targetRole)) {
          showToast(`🔔 ${d.message}`, "info", 6000);
        }
      }
    });
  });
}

// ─── Banner Auto-Slider ───────────────────────────────────────────────────────
function initBannerSlider() {
  const slides = document.querySelectorAll(".banner-slide");
  const dots = document.querySelectorAll(".banner-dot");
  if (!slides.length) return;

  let current = 0;

  function goTo(idx) {
    slides[current].classList.remove("active");
    dots[current]?.classList.remove("active");
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add("active");
    dots[current]?.classList.add("active");
  }

  // Auto advance every 4s
  let timer = setInterval(() => goTo(current + 1), 4000);

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      clearInterval(timer);
      goTo(i);
      timer = setInterval(() => goTo(current + 1), 4000);
    });
  });

  document.querySelector(".banner-prev")?.addEventListener("click", () => {
    clearInterval(timer);
    goTo(current - 1);
    timer = setInterval(() => goTo(current + 1), 4000);
  });

  document.querySelector(".banner-next")?.addEventListener("click", () => {
    clearInterval(timer);
    goTo(current + 1);
    timer = setInterval(() => goTo(current + 1), 4000);
  });

  goTo(0);
}

// ─── Voice Channel UI (cosmetic — real VOIP requires WebRTC/Agora) ─────────────
export function joinVoiceChannel(channelName) {
  showToast(`Joined voice channel: ${channelName}`, "success");
  document.querySelectorAll(".voice-channel").forEach((v) => v.classList.remove("joined"));
  const el = document.querySelector(`[data-voice="${channelName}"]`);
  el?.classList.add("joined");
}

// ─── Offer Section ────────────────────────────────────────────────────────────
// If no offers exist in Firestore, "COMING SOON" is shown by default in HTML.
// This function checks and swaps it if offers are found.
export async function loadOffers() {
  const container = $("offers-container");
  if (!container) return;

  try {
    const snap = await getDocs(collection(db, "offers"));
    if (snap.empty) return; // Keep COMING SOON fallback

    container.innerHTML = "";
    snap.forEach((d) => {
      const o = d.data();
      const el = document.createElement("div");
      el.className = "offer-card glass";
      el.innerHTML = `
        <div class="offer-badge">${o.badge || "HOT"}</div>
        <h3>${escHtml(o.title)}</h3>
        <p>${escHtml(o.description)}</p>
        <div class="offer-price">${escHtml(o.price || "FREE")}</div>
        <button class="btn-glow" onclick="showToast('Redirecting to offer…','info')">CLAIM</button>
      `;
      container.appendChild(el);
    });
  } catch {
    // Keep fallback on error
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function escHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatRelTime(date) {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Keyboard shortcut: Enter to send chat ────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  $("chat-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  $("send-btn")?.addEventListener("click", sendMessage);

  // Announcement form
  $("ann-submit-btn")?.addEventListener("click", () => {
    const title = $("ann-title-input")?.value.trim();
    const body = $("ann-body-input")?.value.trim();
    if (title && body) {
      postAnnouncement(title, body);
      $("ann-title-input").value = "";
      $("ann-body-input").value = "";
    }
  });

  // Offers
  loadOffers();

  // Init dashboard
  initDashboard();
});
