// firebase.js

// Firebase config for GlowSalon project
const firebaseConfig = {
  apiKey: "AIzaSyB7HGGy7zBrNqBUWfNZWKvxz8adDi_kw9E",
  authDomain: "glowsalon-d1a2a.firebaseapp.com",
  projectId: "glowsalon-d1a2a",
  storageBucket: "glowsalon-d1a2a.appspot.com",
  messagingSenderId: "301556898816",
  appId: "1:301556898816:web:12573a0aabd542f5154ce5"
};

// Initialize Firebase (compat version)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
