import { db } from '../lib/firebase.js';
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

// 새로운 수입 데이터
const newIncomeData = [
  { date: '2022-05-20', name: '인계 from Jackie', amount: 54.05, note: '' },
  { date: '2022-06-21', name: '월 회비', amount: 150.01, note: '' },
  { date: '2022-07-21', name: '월 회비', amount: 150.04, note: '' },
  { date: '2022-08-22', name: '월 회비', amount: 150.07, note: '' },
  { date: '2022-09-26', name: '월 회비', amount: 150.00, note: '' },
  { date: '2022-10-27', name: '월 회비', amount: 150.00, note: '' },
  { date: '2022-11-21', name: '월 회비', amount: 150.10, note: '' },
  { date: '2022-11-30', name: '회원 가입비 - Andrew', amount: 30.00, note: '' },
  { date: '2022-11-30', name: '월 회비 - Andrew', amount: 30.00, note: '' },
  { date: '2022-12-20', name: '월회비', amount: 240.00, note: '' },
  { date: '2023-01-13', name: '월회비(1월)', amount: 240.00, note: '' },
  { date: '2023-02-28', name: '월회비(2월)', amount: 240.00, note: '' },
  { date: '2023-03-20', name: '월회비(3월)', amount: 240.00, note: '' },
  { date: '2023-05-10', name: '월회비(4월)', amount: 250.00, note: '' },
  { date: '2023-05-22', name: '월회비(5월)', amount: 240.00, note: '' },
  { date: '2023-06-30', name: '월회비(6월)', amount: 240.00, note: '' },
  { date: '2023-07-25', name: '월회비(7월)', amount: 240.00, note: '' },
  { date: '2023-08-21', name: '월회비(8월)', amount: 300.00, note: '' },
  { date: '2023-09-21', name: '월회비(9월)', amount: 300.09, note: '' },
  { date: '2023-10-23', name: '월회비(10월)', amount: 300.00, note: '' },
  { date: '2023-11-21', name: '월회비(11월)', amount: 300.00, note: '' },
  { date: '2023-12-22', name: '월회비(12월)', amount: 260.00, note: '' },
  { date: '2024-01-22', name: '월회비(1월)', amount: 260.00, note: '' },
  { date: '2024-02-28', name: '월회비(2월)', amount: 280.09, note: '' },
  { date: '2024-02-28', name: '월회비(3월)', amount: 280.00, note: '' },
  { date: '2024-04-19', name: '월회비(4월)', amount: 280.00, note: '' },
  { date: '2024-05-21', name: '월회비(5월)', amount: 280.00, note: '' },
  { date: '2024-06-21', name: '월회비(6월)', amount: 280.00, note: '' },
  { date: '2024-07-21', name: '월회비(7월)', amount: 280.00, note: '' },
  { date: '2024-08-20', name: '월회비(8월)', amount: 280.00, note: '' },
  { date: '2024-09-21', name: '월회비(9월)', amount: 330.99, note: '' },
  { date: '2024-10-21', name: '월회비(10월)', amount: 280.00, note: '' },
  { date: '2024-11-21', name: '월회비(11월)', amount: 280.00, note: '' },
  { date: '2024-12-20', name: '월회비(12월)', amount: 280.00, note: '' },
  { date: '2025-01-21', name: '월회비(1월)', amount: 280.00, note: '' },
  { date: '2025-02-21', name: '월회비(2월)', amount: 280.00, note: '' }
];

// 기존 수입 데이터 삭제 및 새 데이터 추가 함수
async function updateIncomeData() {
  try {
    console.log('수입 데이터 업데이트 시작...');
    
    // 기존 수입 데이터 가져오기
    const incomesCollection = collection(db, 'incomes');
    const incomesSnapshot = await getDocs(incomesCollection);
    
    // 기존 데이터 삭제
    console.log('기존 수입 데이터 삭제 중...');
    const deletePromises = incomesSnapshot.docs.map(async (document) => {
      console.log(`수입 데이터 삭제: ${document.id}`);
      await deleteDoc(doc(db, 'incomes', document.id));
    });
    
    await Promise.all(deletePromises);
    console.log('기존 수입 데이터 삭제 완료');
    
    // 새 데이터 추가
    console.log('새 수입 데이터 추가 중...');
    const addPromises = newIncomeData.map(async (income) => {
      const docRef = await addDoc(incomesCollection, income);
      console.log(`새 수입 데이터 추가: ${docRef.id}`);
    });
    
    await Promise.all(addPromises);
    console.log('새 수입 데이터 추가 완료');
    
    console.log('수입 데이터 업데이트 완료!');
  } catch (error) {
    console.error('수입 데이터 업데이트 중 오류 발생:', error);
  }
}

// 스크립트 실행
updateIncomeData(); 