import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAyOMZBRao9kSfPwwIDGbKJMYlYz4xv1Vs",
  authDomain: "placement-os-b85cd.firebaseapp.com",
    projectId: "placement-os-b85cd",
  storageBucket: "placement-os-b85cd.firebasestorage.app",
  messagingSenderId: "731940605034",
  appId: "1:1077851757638:web:cb1784a31b0c8f0c757e47"
  
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);



