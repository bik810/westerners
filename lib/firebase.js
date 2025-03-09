// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwj2gCeTR8idcscEjm_BGugegR6JsnOSs",
  authDomain: "westerners-63a9d.firebaseapp.com",
  projectId: "westerners-63a9d",
  storageBucket: "westerners-63a9d.firebasestorage.app",
  messagingSenderId: "108795063660",
  appId: "1:108795063660:web:51bf88c36124bc8d7dd749"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export the Firestore database instance
export { db }; 