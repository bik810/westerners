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

// 스토리지 버킷 URL 출력 (디버깅용)
console.log('Firebase Storage 버킷:', firebaseConfig.storageBucket);

// Initialize Authentication
const auth = getAuth(app);

// 개발 환경에서 CORS 오류 방지를 위한 설정
if (typeof window !== 'undefined') {
  console.log('Firebase 초기화 완료, 현재 호스트:', window.location.hostname);
  
  // Firebase 인증 상태 변경 리스너 설정
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('사용자 인증됨:', user.uid);
      // 인증된 사용자의 토큰 갱신 (15분마다)
      const tokenRefreshInterval = setInterval(() => {
        user.getIdToken(true).then((token) => {
          console.log('인증 토큰 자동 갱신됨');
          // 토큰을 localStorage에 저장 (선택사항)
          localStorage.setItem('firebaseAuthToken', token);
        }).catch((error) => {
          console.error('토큰 갱신 오류:', error);
        });
      }, 15 * 60 * 1000); // 15분마다 갱신
      
      // 초기 토큰 갱신
      user.getIdToken(true).then((token) => {
        console.log('초기 인증 토큰 갱신됨');
        localStorage.setItem('firebaseAuthToken', token);
      });
      
      // 컴포넌트 언마운트 시 인터벌 정리
      return () => clearInterval(tokenRefreshInterval);
    } else {
      console.log('사용자 인증되지 않음');
      localStorage.removeItem('firebaseAuthToken');
    }
  });
}

// Export the Firestore database instance, Storage, and Auth
export { db, storage, auth }; 