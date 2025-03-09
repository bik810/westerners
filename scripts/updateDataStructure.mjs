// Firebase 데이터 구조 업데이트 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

// 데이터 구조 업데이트 함수
const updateDataStructure = async () => {
  try {
    // 수입 내역(incomes) 업데이트
    console.log('수입 내역 데이터 구조 업데이트 시작...');
    const incomesSnapshot = await getDocs(collection(db, 'incomes'));
    
    for (const document of incomesSnapshot.docs) {
      const data = document.data();
      
      // 기존 데이터에서 필요한 필드 추출
      const { name, paid, amount, date } = data;
      
      // 새 구조로 업데이트
      const updatedData = {
        date: date || '날짜 없음',
        description: `${name} 회비 납부`,
        amount: amount || 0,
        note: paid ? '납부 완료' : '미납',
        // 기존 필드도 유지 (필요시 삭제 가능)
        name,
        paid
      };
      
      await updateDoc(doc(db, 'incomes', document.id), updatedData);
      console.log(`수입 내역 ID: ${document.id} 업데이트 완료`);
    }
    
    console.log('수입 내역 데이터 구조 업데이트 완료!');
    
    // 지출 내역(expenditures) 업데이트
    console.log('지출 내역 데이터 구조 업데이트 시작...');
    const expendituresSnapshot = await getDocs(collection(db, 'expenditures'));
    
    for (const document of expendituresSnapshot.docs) {
      const data = document.data();
      
      // 기존 데이터에서 필요한 필드 추출
      const { description, amount, date } = data;
      
      // 새 구조로 업데이트
      const updatedData = {
        date: date || '날짜 없음',
        description: description || '내역 없음',
        amount: amount || 0,
        note: '',
      };
      
      await updateDoc(doc(db, 'expenditures', document.id), updatedData);
      console.log(`지출 내역 ID: ${document.id} 업데이트 완료`);
    }
    
    console.log('지출 내역 데이터 구조 업데이트 완료!');
    console.log('모든 데이터 구조 업데이트 완료!');
    
  } catch (error) {
    console.error('데이터 구조 업데이트 중 오류 발생:', error);
  }
};

// 스크립트 실행
updateDataStructure()
  .then(() => console.log('데이터 구조 업데이트 스크립트 완료!'))
  .catch(error => console.error('스크립트 실행 중 오류 발생:', error))
  .finally(() => process.exit(0)); 