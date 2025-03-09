import { db } from '../lib/firebase.js';
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

// 새로운 지출 데이터
const newExpenseData = [
  { date: '2022-07-21', description: '정기 모임', amount: 306.02, note: '' },
  { date: '2022-09-15', description: '정기 모임', amount: 198.15, note: '' },
  { date: '2022-11-30', description: '정기 모임', amount: 457.60, note: '' },
  { date: '2022-12-05', description: '월드컵 배팅 상금(To Martin)', amount: 25.00, note: '' },
  { date: '2022-12-05', description: '월드컵 배팅 상금(To Jay)', amount: 25.00, note: '' },
  { date: '2023-01-12', description: '정기 모임', amount: 242.50, note: '' },
  { date: '2023-03-29', description: '정기모임', amount: 730.62, note: '' },
  { date: '2023-05-23', description: '정기모임', amount: 387.50, note: '' },
  { date: '2023-07-31', description: '정기모임', amount: 503.71, note: '' },
  { date: '2023-09-21', description: '정기모임', amount: 485.86, note: '' },
  { date: '2023-11-17', description: '정기모임', amount: 460.94, note: '' },
  { date: '2024-01-23', description: '정기모임', amount: 390.22, note: '' },
  { date: '2024-03-25', description: '정기모임', amount: 1030.61, note: '계림닭도리탕: $483.87, 바: $546.74' },
  { date: '2024-05-21', description: '정기모임', amount: 437.05, note: '탄탄: $416.05, 생일: $21' },
  { date: '2024-07-19', description: '정기모임', amount: 553.93, note: '탄탄: $375.28, 오구당: 178.65' },
  { date: '2024-09-30', description: '정기모임', amount: 495.55, note: '장소: 495.55' },
  { date: '2024-11-18', description: '정기모임', amount: 456.81, note: '탄탄: 456.81' },
  { date: '2025-02-06', description: '정기모임', amount: 797.30, note: '회랑고기방: 797.3' }
];

// 기존 지출 데이터 삭제 및 새 데이터 추가 함수
async function updateExpenseData() {
  try {
    console.log('지출 데이터 업데이트 시작...');
    
    // 기존 지출 데이터 가져오기
    const expendituresCollection = collection(db, 'expenditures');
    const expendituresSnapshot = await getDocs(expendituresCollection);
    
    // 기존 데이터 삭제
    console.log('기존 지출 데이터 삭제 중...');
    const deletePromises = expendituresSnapshot.docs.map(async (document) => {
      console.log(`지출 데이터 삭제: ${document.id}`);
      await deleteDoc(doc(db, 'expenditures', document.id));
    });
    
    await Promise.all(deletePromises);
    console.log('기존 지출 데이터 삭제 완료');
    
    // 새 데이터 추가
    console.log('새 지출 데이터 추가 중...');
    const addPromises = newExpenseData.map(async (expense) => {
      const docRef = await addDoc(expendituresCollection, expense);
      console.log(`새 지출 데이터 추가: ${docRef.id}`);
    });
    
    await Promise.all(addPromises);
    console.log('새 지출 데이터 추가 완료');
    
    console.log('지출 데이터 업데이트 완료!');
  } catch (error) {
    console.error('지출 데이터 업데이트 중 오류 발생:', error);
  }
}

// 스크립트 실행
updateExpenseData(); 