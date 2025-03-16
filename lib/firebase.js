// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator, setPersistence, browserSessionPersistence } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// 개발 환경 여부 확인
const isDevelopment = process.env.NODE_ENV === 'development';

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

// 개발 환경에서는 에뮬레이터 사용
if (isDevelopment) {
  console.log('개발 환경에서 Firebase 에뮬레이터 사용');
  
  // 실제 에뮬레이터를 사용하는 경우 아래 코드 주석 해제
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, 'localhost', 9199);
  
  // 에뮬레이터 대신 mockAuth 모듈을 사용하므로 실제 Firebase 서비스 호출 방지
  console.log('개발 환경에서는 mockAuth 모듈을 사용하여 실제 Firebase 서비스 호출을 방지합니다.');
}

// 스토리지 버킷 URL 출력 (디버깅용)
if (isDevelopment) {
  console.log('Firebase Storage 버킷:', firebaseConfig.storageBucket);
  console.log('Firebase Storage 버킷 전체 URL:', `https://${firebaseConfig.storageBucket}`);

  // CORS 설정 확인
  if (typeof window !== 'undefined') {
    console.log('현재 도메인:', window.location.origin);
    console.log('Storage 버킷 도메인:', `https://${firebaseConfig.storageBucket}`);
  }
}

// 브라우저를 닫으면 자동 로그아웃되도록 세션 지속성 설정
if (typeof window !== 'undefined' && !isDevelopment) {
  setPersistence(auth, browserSessionPersistence)
    .then(() => {
      console.log('Firebase 인증 지속성이 브라우저 세션으로 설정됨 (브라우저 닫으면 로그아웃)');
    })
    .catch((error) => {
      console.error('인증 지속성 설정 오류:', error);
    });
}

// 프로덕션 환경에서 CORS 오류 방지를 위한 설정
if (typeof window !== 'undefined') {
  // Firebase 인증 상태 변경 리스너 설정
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('사용자 인증됨:', user.uid);
      
      if (!isDevelopment) {
        // 인증된 사용자의 토큰 갱신 (15분마다)
        const tokenRefreshInterval = setInterval(() => {
          user.getIdToken(true).then((token) => {
            console.log('인증 토큰 자동 갱신됨');
            // 토큰을 sessionStorage에 저장 (브라우저 닫으면 삭제됨)
            sessionStorage.setItem('firebaseAuthToken', token);
          }).catch((error) => {
            console.error('토큰 갱신 오류:', error);
          });
        }, 15 * 60 * 1000); // 15분마다 갱신
        
        // 초기 토큰 갱신
        user.getIdToken(true).then((token) => {
          console.log('초기 인증 토큰 갱신됨');
          sessionStorage.setItem('firebaseAuthToken', token);
        });
        
        // 컴포넌트 언마운트 시 인터벌 정리
        return () => clearInterval(tokenRefreshInterval);
      }
    } else {
      console.log('사용자 인증되지 않음');
      sessionStorage.removeItem('firebaseAuthToken');
    }
  });
}

// Export the Firestore database instance, Storage, and Auth
export { db, storage, auth }; 