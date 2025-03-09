import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyANTVPnqlSaTJSCzXA6wYVI3uuwzj2wf-Y",
    authDomain: "smart-library-e1ba7.firebaseapp.com",
    projectId: "smart-library-e1ba7",
    storageBucket: "smart-library-e1ba7.firebasestorage.app",
    messagingSenderId: "835647604039",
    appId: "1:835647604039:web:36a7698a5caf3d3704b862",
    measurementId: "G-F9CXSHK92H"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
