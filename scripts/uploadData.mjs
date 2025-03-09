// 기존 데이터를 Firebase에 업로드하는 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase 구성
const firebaseConfig = {
  apiKey: "AIzaSyDwj2gCeTR8idcscEjm_BGugegR6JsnOSs",
  authDomain: "westerners-63a9d.firebaseapp.com",
  projectId: "westerners-63a9d",
  storageBucket: "westerners-63a9d.firebasestorage.app",
  messagingSenderId: "108795063660",
  appId: "1:108795063660:web:51bf88c36124bc8d7dd749"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 기존 회원 데이터
const membersData = [
  { name: '김서준', paid: true, amount: 10000, date: '2023-03-01' },
  { name: '이민준', paid: true, amount: 10000, date: '2023-03-02' },
  { name: '박도윤', paid: false, amount: 0, date: '-' },
  { name: '정지훈', paid: true, amount: 10000, date: '2023-03-05' },
  { name: '최예준', paid: false, amount: 0, date: '-' },
];

// 기존 지출 데이터
const expensesData = [
  { description: '3월 모임 장소 대여', amount: 30000, date: '2023-03-15' },
  { description: '다과 구매', amount: 15000, date: '2023-03-15' },
];

// 데이터 업로드 함수
const uploadData = async () => {
  try {
    console.log('회원 데이터 업로드 시작...');
    for (const member of membersData) {
      await addDoc(collection(db, 'members'), member);
      console.log(`${member.name} 데이터 업로드 완료`);
    }
    
    console.log('지출 데이터 업로드 시작...');
    for (const expense of expensesData) {
      await addDoc(collection(db, 'expenses'), expense);
      console.log(`${expense.description} 데이터 업로드 완료`);
    }
    
    console.log('모든 데이터 업로드 완료!');
  } catch (error) {
    console.error('데이터 업로드 중 오류 발생:', error);
  }
};

// 스크립트 실행
uploadData(); 