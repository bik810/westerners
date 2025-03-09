// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  // 환경 변수가 있으면 사용하고, 없으면 하드코딩된 값 사용 (개발 테스트용)
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBQXV4YV5OgE3ikOcbOoe1XJqUzgNvoC9g",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "westerners-63a9d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "westerners-63a9d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "westerners-63a9d.appspot.com",
  messagingSenderId: "108795063660",
  appId: "1:108795063660:web:51bf88c36124bc8d7dd749"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export the Firestore database instance
export { db }; 