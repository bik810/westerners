import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

// 컬렉션 참조 함수
export const getIncomesCollection = () => collection(db, 'incomes');
export const getExpendituresCollection = () => collection(db, 'expenditures');

// 수입 관련 함수
export const getAllMembers = async () => {
  const incomesSnapshot = await getDocs(query(getIncomesCollection(), orderBy('date', 'desc')));
  return incomesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// 회원 추가하기
export const addMember = async (memberData) => {
  return await addDoc(getIncomesCollection(), memberData);
};

// 회원 정보 업데이트
export const updateMember = async (id, memberData) => {
  const memberRef = doc(db, 'incomes', id);
  await updateDoc(memberRef, memberData);
};

// 회원 삭제하기
export const deleteMember = async (id) => {
  const memberRef = doc(db, 'incomes', id);
  await deleteDoc(memberRef);
};

// 지출 관련 함수
// 모든 지출 내역 가져오기
export const getAllExpenses = async () => {
  const expendituresSnapshot = await getDocs(query(getExpendituresCollection(), orderBy('date', 'desc')));
  return expendituresSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// 지출 내역 추가하기
export const addExpense = async (expenseData) => {
  return await addDoc(getExpendituresCollection(), expenseData);
};

// 지출 내역 업데이트
export const updateExpense = async (id, expenseData) => {
  const expenseRef = doc(db, 'expenditures', id);
  await updateDoc(expenseRef, expenseData);
};

// 지출 내역 삭제하기
export const deleteExpense = async (id) => {
  const expenseRef = doc(db, 'expenditures', id);
  await deleteDoc(expenseRef);
}; 