// Firebase config placeholder
// 1) Create a Firebase project at https://console.firebase.google.com/
// 2) Enable Firestore (database) in the project
// 3) (Optional) Enable Authentication for admin email/password sign-in
// 4) Replace the config object below with your project's config.
// 5) Deploy to GitHub Pages. No server required.

const firebaseConfig = {
  apiKey: "AIzaSyB7HGGy7zBrNqBUWfNZWKvxz8adDi_kw9E",
  authDomain: "glowsalon-d1a2a.firebaseapp.com",
  projectId: "glowsalon-d1a2a",
  storageBucket: "glowsalon-d1a2a.firebasestorage.app",
  messagingSenderId: "301556898816",
  appId: "1:301556898816:web:12573a0aabd542f5154ce5"
};

// --- Firebase v9 modular SDK (loaded from CDN in runtime) ---
// We'll dynamically load Firebase scripts in main.js so this file can stay simple.
window.__FIREBASE_CONFIG = firebaseConfig;
