// 관리자 계정 초기화 스크립트
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 관리자 계정 정보
const adminUserId = 'bik810';
const adminEmail = `${adminUserId}@westerners.com`; // 이메일 형식으로 변환
const adminPassword = '1qaz2wsx';
const adminData = {
  userId: adminUserId,
  email: adminEmail,
  name: '관리자',
  role: 'admin',
  phone: '',
  createdAt: new Date().toISOString(),
  isFirstLogin: true
};

// 관리자 계정 생성 함수
async function createAdminUser() {
  try {
    console.log('관리자 계정 생성 시작...');
    
    // 이미 존재하는 계정인 경우 에러가 발생할 수 있으므로 try-catch로 처리
    try {
      // Firebase Auth에 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), adminData);
      
      console.log('관리자 계정이 성공적으로 생성되었습니다.');
      console.log('사용자 ID:', adminUserId);
      console.log('비밀번호:', adminPassword);
      console.log('첫 로그인 시 비밀번호를 변경해주세요.');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('이미 존재하는 관리자 계정입니다.');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('관리자 계정 생성 중 오류 발생:', error);
  } finally {
    process.exit();
  }
}

// 스크립트 실행
createAdminUser(); 