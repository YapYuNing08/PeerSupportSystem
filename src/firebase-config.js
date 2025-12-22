// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6rNOnnio1ozgomJ-vsXqnLQs54ckJLKg",
  authDomain: "peersupportsystem.firebaseapp.com",
  projectId: "peersupportsystem",
  storageBucket: "peersupportsystem.firebasestorage.app",
  messagingSenderId: "382076673954",
  appId: "1:382076673954:web:6b1d94e8a7d64720711cfb",
  measurementId: "G-5PDCR1B3N6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth=getAuth();
export const db=getFirestore(app);
export default app;