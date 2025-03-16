// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
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

// 개발 환경에서 설정 로깅
if (isDevelopment && typeof window !== 'undefined') {
  console.log('Firebase 설정 (개발 환경):', {
    apiKey: firebaseConfig.apiKey ? '설정됨' : '미설정',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  });
}

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('Firebase 앱 초기화 성공');
  } catch (error) {
    console.error('Firebase 앱 초기화 오류:', error);
    // 개발 환경에서 오류 발생 시 대체 로직
    if (isDevelopment) {
      console.log('개발 환경에서 대체 초기화 시도');
      // 환경 변수에서 값을 가져오되, 하드코딩된 값은 제거
      const fallbackConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };
      app = initializeApp(fallbackConfig);
      console.log('개발 환경용 대체 설정으로 Firebase 앱 초기화');
    }
  }
} else {
  app = getApps()[0]; // 이미 초기화된 앱이 있으면 그것을 사용
  console.log('기존 Firebase 앱 사용');
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage with CORS settings
const storage = getStorage(app);

// 스토리지 버킷 URL 출력 (디버깅용)
console.log('Firebase Storage 버킷:', firebaseConfig.storageBucket);
console.log('Firebase Storage 버킷 전체 URL:', `https://${firebaseConfig.storageBucket}`);

// CORS 설정 확인
if (typeof window !== 'undefined') {
  console.log('현재 도메인:', window.location.origin);
  console.log('Storage 버킷 도메인:', `https://${firebaseConfig.storageBucket}`);
}

// Initialize Authentication
const auth = getAuth(app);

// 브라우저를 닫으면 자동 로그아웃되도록 세션 지속성 설정
if (typeof window !== 'undefined') {
  setPersistence(auth, browserSessionPersistence)
    .then(() => {
      console.log('Firebase 인증 지속성이 브라우저 세션으로 설정됨 (브라우저 닫으면 로그아웃)');
    })
    .catch((error) => {
      console.error('인증 지속성 설정 오류:', error);
    });
}

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
    } else {
      console.log('사용자 인증되지 않음');
      sessionStorage.removeItem('firebaseAuthToken');
    }
  });
}

// Export the Firestore database instance, Storage, and Auth
export { db, storage, auth }; 