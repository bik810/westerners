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

// 개발 환경에서는 모의 인증 모듈 사용
import mockAuthModule, { 
  mockGetAllUsers, 
  mockGetUserById,
  createUserWithEmailAndPassword as mockCreateUser,
  signInWithEmailAndPassword as mockSignIn,
  signOut as mockSignOut,
  updatePassword as mockUpdatePassword,
  sendPasswordResetEmail as mockSendPasswordReset
} from './mockAuth';

// 개발 환경 여부 확인
const isDevelopment = process.env.NODE_ENV === 'development';

// 모의 데이터 (개발 환경용)
const mockIncomes = [
  { id: 'inc1', name: '김회원', amount: 50, date: '2023-03-01', note: '3월 회비' },
  { id: 'inc2', name: '이회원', amount: 50, date: '2023-03-02', note: '3월 회비' },
  { id: 'inc3', name: '박회원', amount: 50, date: '2023-03-03', note: '3월 회비' }
];

const mockExpenses = [
  { id: 'exp1', description: '3월 모임 식사비', amount: 120, date: '2023-03-15', note: '식당 결제' },
  { id: 'exp2', description: '모임 용품 구매', amount: 30, date: '2023-03-20', note: '문구류' }
];

// 컬렉션 참조 함수
export const getIncomesCollection = () => collection(db, 'incomes');
export const getExpendituresCollection = () => collection(db, 'expenditures');
export const getUsersCollection = () => collection(db, 'users');

// 수입 관련 함수
export const getAllMembers = async () => {
  if (isDevelopment) {
    console.log('개발 환경 - 모의 회원 데이터 반환');
    return mockIncomes;
  }

  const incomesSnapshot = await getDocs(query(getIncomesCollection(), orderBy('date', 'desc')));
  return incomesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// 회원 추가하기
export const addMember = async (memberData) => {
  if (isDevelopment) {
    console.log('개발 환경 - 모의 회원 추가:', memberData);
    const newId = `inc${Date.now()}`;
    mockIncomes.push({ id: newId, ...memberData });
    return { id: newId };
  }

  return await addDoc(getIncomesCollection(), memberData);
};

// 회원 정보 업데이트
export const updateMember = async (id, memberData) => {
  if (isDevelopment) {
    console.log('개발 환경 - 모의 회원 업데이트:', id, memberData);
    const index = mockIncomes.findIndex(item => item.id === id);
    if (index !== -1) {
      mockIncomes[index] = { ...mockIncomes[index], ...memberData };
    }
    return;
  }

  const memberRef = doc(db, 'incomes', id);
  await updateDoc(memberRef, memberData);
};

// 회원 삭제하기
export const deleteMember = async (id) => {
  if (isDevelopment) {
    console.log('개발 환경 - 모의 회원 삭제:', id);
    const index = mockIncomes.findIndex(item => item.id === id);
    if (index !== -1) {
      mockIncomes.splice(index, 1);
    }
    return;
  }

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
    if (isDevelopment) {
      console.log('개발 환경 - 모의 사용자 생성:', email, userData);
      const userCredential = await mockCreateUser(null, email, password);
      const user = userCredential.user;
      
      // 사용자 정보를 모의 데이터에 저장
      console.log('개발 환경 - 모의 사용자 정보 저장:', user.uid, userData);
      return user;
    }

    // Firebase Authentication에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Firestore에 사용자 정보 저장
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email: user.email,
      createdAt: new Date().toISOString()
    });
    
    return user;
  } catch (error) {
    console.error('사용자 생성 중 오류 발생:', error);
    throw error;
  }
};

// 사용자 로그인
export const loginUser = async (email, password) => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 로그인:', email);
      return await mockSignIn(null, email, password);
    }

    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('로그인 중 오류 발생:', error);
    throw error;
  }
};

// 사용자 로그아웃
export const logoutUser = async () => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 로그아웃');
      return await mockSignOut();
    }

    return await signOut(auth);
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error);
    throw error;
  }
};

// 비밀번호 변경
export const changePassword = async (user, newPassword) => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 비밀번호 변경');
      return await mockUpdatePassword(user, newPassword);
    }

    await updatePassword(user, newPassword);
    
    // 사용자의 isFirstLogin 상태 업데이트
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      isFirstLogin: false
    });
  } catch (error) {
    console.error('비밀번호 변경 중 오류 발생:', error);
    throw error;
  }
};

// 비밀번호 재설정 이메일 전송
export const sendPasswordReset = async (email) => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 비밀번호 재설정 이메일 전송:', email);
      return await mockSendPasswordReset(null, email);
    }

    return await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('비밀번호 재설정 이메일 전송 중 오류 발생:', error);
    throw error;
  }
};

// 모든 사용자 정보 가져오기 (관리자용)
export const getAllUsers = async () => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 사용자 목록 반환');
      return await mockGetAllUsers();
    }

    const usersSnapshot = await getDocs(getUsersCollection());
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('사용자 목록 로드 중 오류 발생:', error);
    throw error;
  }
};

// 특정 사용자 정보 가져오기
export const getUserById = async (userId) => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 사용자 정보 반환:', userId);
      return await mockGetUserById(userId);
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    } else {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('사용자 정보 로드 중 오류 발생:', error);
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