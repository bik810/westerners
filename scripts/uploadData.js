// 기존 데이터를 Firebase에 업로드하는 스크립트
import { addMember, addExpense } from '../lib/firestoreService';

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
      await addMember(member);
      console.log(`${member.name} 데이터 업로드 완료`);
    }
    
    console.log('지출 데이터 업로드 시작...');
    for (const expense of expensesData) {
      await addExpense(expense);
      console.log(`${expense.description} 데이터 업로드 완료`);
    }
    
    console.log('모든 데이터 업로드 완료!');
  } catch (error) {
    console.error('데이터 업로드 중 오류 발생:', error);
  }
};

// 스크립트 실행
uploadData(); 