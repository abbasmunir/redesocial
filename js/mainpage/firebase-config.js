
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfY9t2-ytCYvjNxJVehfUjJRYYfpFeqjY",
  authDomain: "redesocialarcade-ab44e.firebaseapp.com",
  projectId: "redesocialarcade-ab44e",
  storageBucket: "redesocialarcade-ab44e.firebasestorage.app",
  messagingSenderId: "951201819271",
  appId: "1:951201819271:web:dc912bd1bcb06b0a672622"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);