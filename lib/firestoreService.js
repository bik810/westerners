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
  orderBy,
  setDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth } from './firebase';

// 컬렉션 참조 함수
export const getIncomesCollection = () => collection(db, 'incomes');
export const getExpendituresCollection = () => collection(db, 'expenditures');
export const getUsersCollection = () => collection(db, 'users');

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

// 사용자 관리 함수
// 사용자 생성 (관리자용)
export const createUser = async (email, password, userData) => {
  try {
    // Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Firestore에 사용자 정보 저장
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: userData.role || 'member', // 'admin', 'treasurer', 'member'
      name: userData.name || '',
      phone: userData.phone || '',
      createdAt: new Date().toISOString(),
      isFirstLogin: false,
      ...userData
    });
    
    return user;
  } catch (error) {
    console.error('사용자 생성 중 오류 발생:', error);
    throw error;
  }
};

// 사용자 ID를 이메일로 변환하는 함수
const convertUserIdToEmail = (userId) => {
  // 이미 이메일 형식인 경우 그대로 반환
  if (userId.includes('@')) {
    return userId;
  }
  // 이메일 형식으로 변환
  return `${userId}@westerners.com`;
};

// 사용자 로그인
export const loginUser = async (userId, password) => {
  try {
    // 사용자 ID를 이메일로 변환
    const email = convertUserIdToEmail(userId);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('로그인 중 오류 발생:', error);
    throw error;
  }
};

// 사용자 로그아웃
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error);
    throw error;
  }
};

// 비밀번호 변경
export const changePassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updatePassword(user, newPassword);
      
      // 첫 로그인 상태 업데이트
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { isFirstLogin: false });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('비밀번호 변경 중 오류 발생:', error);
    throw error;
  }
};

// 비밀번호 재설정 이메일 전송
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('비밀번호 재설정 이메일 전송 중 오류 발생:', error);
    throw error;
  }
};

// 모든 사용자 정보 가져오기 (관리자용)
export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(query(getUsersCollection(), orderBy('createdAt', 'desc')));
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('사용자 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

// 특정 사용자 정보 가져오기
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);
    throw error;
  }
};

// 사용자 정보 업데이트
export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
    return true;
  } catch (error) {
    console.error('사용자 정보 업데이트 중 오류 발생:', error);
    throw error;
  }
};

// 사용자 삭제 (관리자용)
export const deleteUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error('사용자 삭제 중 오류 발생:', error);
    throw error;
  }
}; 