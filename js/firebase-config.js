// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCK3N8bBpqr7xeCGK8-g0WSyLUjBV-iK-U",
  authDomain: "edu-gpt-f7808.firebaseapp.com",
  projectId: "edu-gpt-f7808",
  storageBucket: "edu-gpt-f7808.firebasestorage.app",
  messagingSenderId: "1084681482841",
  appId: "1:1084681482841:web:085b34dd5d3344cf2ff748",
  measurementId: "G-RJVK5KDHHF"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for global use
window.firebaseAuth = auth;
window.firebaseDb = db;

console.log('🔥 Firebase initialized successfully');