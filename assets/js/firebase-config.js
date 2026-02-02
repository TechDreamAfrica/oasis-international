// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyC3O06GUcRgAdNQ4A8pXxkzlsYzGvtlKhg",
    authDomain: "oasis-c0682.firebaseapp.com",
    projectId: "oasis-c0682",
    storageBucket: "oasis-c0682.firebasestorage.app",
    messagingSenderId: "1094274857981",
    appId: "1:1094274857981:web:8334fa229fb0706786b794"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export for use in other modules
export { db, auth, app };

// Also set globally for dashboard modules that use fallback
if (typeof window !== 'undefined') {
    window.db = db;
    window.auth = auth;
}
