import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDzdkhgEDFRyzQGS4T4117kH846LeCJieE",
  authDomain: "finguard-aa409.firebaseapp.com",
  projectId: "finguard-aa409",
  storageBucket: "finguard-aa409.firebasestorage.app",
  messagingSenderId: "909866257880",
  appId: "1:909866257880:web:cf9efac117536d32ee76ad",
  measurementId: "G-7PFTXG9DQT"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
