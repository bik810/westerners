// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // 이미 초기화된 앱이 있으면 그것을 사용
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage with CORS settings
const storage = getStorage(app);

// Initialize Authentication
const auth = getAuth(app);

// 개발 환경에서 CORS 오류 방지를 위한 설정
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // 개발 환경에서만 실행되는 코드
  console.log('개발 환경에서 Firebase 실행 중');
}

// Export the Firestore database instance, Storage, and Auth
export { db, storage, auth }; 