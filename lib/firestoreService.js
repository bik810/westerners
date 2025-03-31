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
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser as deleteAuthUser
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
  sendPasswordResetEmail as mockSendPasswordReset,
  sendEmailVerification as mockSendEmailVerification
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
    // 먼저 Firestore에서 사용자 정보 가져오기
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    // Firestore에서 사용자 문서 삭제
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    
    if (isDevelopment) {
      console.log('개발 환경 - 모의 사용자 삭제:', userId);
      return true;
    }
    
    try {
      // Firebase Auth에서 해당 사용자 계정 찾기 및 삭제
      // 관리자 계정을 통해 삭제해야 함
      // 참고: Admin SDK를 사용하는 것이 더 적합하지만, 클라이언트에서는 불가능
      // 따라서 현재는 Firestore 데이터만 삭제
      console.log('Firebase Authentication에서 사용자 삭제를 시도하려면 Admin SDK가 필요합니다.');
      console.log('현재는 Firestore의 사용자 데이터만 삭제되었습니다.');
    } catch (authError) {
      console.error('Firebase Authentication 사용자 삭제 중 오류:', authError);
      console.log('Firestore의 사용자 데이터는 삭제되었습니다.');
    }
    
    return true;
  } catch (error) {
    console.error('사용자 삭제 중 오류 발생:', error);
    throw error;
  }
};

// 정기모임 정보 가져오기
export const getNextMeeting = async () => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 정기모임 정보 반환');
      return {
        meetingNumber: 10,
        date: '2023년 12월 25일',
        time: '오후 7시',
        location: '차이나타운 레스토랑',
        lastUpdated: new Date().toISOString()
      };
    }

    console.log('정기모임 정보 로드 시작');
    const meetingRef = doc(db, 'settings', 'nextMeeting');
    const meetingSnapshot = await getDoc(meetingRef);
    
    if (meetingSnapshot.exists()) {
      const meetingData = meetingSnapshot.data();
      console.log('정기모임 정보 로드 완료:', meetingData);
      return meetingData;
    } else {
      console.log('정기모임 정보가 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('정기모임 정보 로드 중 오류 발생:', error);
    throw error;
  }
};

// 현재 임원단 정보 가져오기
export const getCurrentExecutive = async () => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 임원단 정보 반환');
      return {
        id: 'exec1',
        generation: 1,
        president: '김회장',
        treasurer: '이총무',
        term: '2023년 1월 ~ 2023년 12월'
      };
    }

    console.log('임원단 정보 로드 시작');
    const executivesQuery = query(collection(db, 'executives'), orderBy('generation', 'desc'));
    const executivesSnapshot = await getDocs(executivesQuery);
    
    console.log('임원단 정보 로드 결과:', executivesSnapshot.size, '개의 문서 발견');
    
    if (!executivesSnapshot.empty) {
      // 첫 번째 문서가 가장 최신 임원단 (generation 내림차순 정렬)
      const currentExecutive = executivesSnapshot.docs[0].data();
      const result = {
        id: executivesSnapshot.docs[0].id,
        ...currentExecutive
      };
      console.log('현재 임원단 정보:', result);
      return result;
    } else {
      console.log('임원단 정보가 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('임원단 정보 로드 중 오류 발생:', error);
    throw error;
  }
};

// 정기모임 정보 업데이트
export const updateNextMeeting = async (meetingData) => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 정기모임 정보 업데이트:', meetingData);
      return true;
    }

    console.log('정기모임 정보 업데이트 시작:', meetingData);
    const docRef = doc(db, 'settings', 'nextMeeting');
    
    // 마지막 업데이트 시간 추가
    const dataToUpdate = {
      ...meetingData,
      lastUpdated: new Date().toISOString()
    };
    
    await setDoc(docRef, dataToUpdate);
    console.log('정기모임 정보 업데이트 완료');
    return true;
  } catch (error) {
    console.error('정기모임 정보 업데이트 오류:', error);
    throw error;
  }
};

// 모임 소개 정보 가져오기
export const getGroupInfo = async () => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 모임 소개 정보 반환');
      return {
        intro: "Westerners는 싱가포르에서 근무하는 한국인들의 친목 모임입니다. 회원들 각자 처한 상황에서의 외로움과 어려움을 함께 나누고 서로에게 힘이 되어주는 따뜻한 모임입니다.",
        activity: "정기적인 모임을 통해 서로의 일상을 나누고 친목을 다집니다. 싱가포르 생활 정보 공유, 함께하는 식사 모임, 특별 행사 등 다양한 활동으로 타국에서도 가족 같은 따뜻함을 느낄 수 있는 시간을 만들어갑니다."
      };
    }

    const docRef = doc(db, 'settings', 'groupInfo');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // 기본값 반환
      return {
        intro: "Westerners는 싱가포르에서 근무하는 한국인들의 친목 모임입니다. 회원들 각자 처한 상황에서의 외로움과 어려움을 함께 나누고 서로에게 힘이 되어주는 따뜻한 모임입니다.",
        activity: "정기적인 모임을 통해 서로의 일상을 나누고 친목을 다집니다. 싱가포르 생활 정보 공유, 함께하는 식사 모임, 특별 행사 등 다양한 활동으로 타국에서도 가족 같은 따뜻함을 느낄 수 있는 시간을 만들어갑니다."
      };
    }
  } catch (error) {
    console.error('모임 소개 정보 가져오기 오류:', error);
    throw error;
  }
};

// 모임 소개 정보 업데이트
export const updateGroupInfo = async (infoData) => {
  try {
    if (isDevelopment) {
      console.log('개발 환경 - 모의 모임 소개 정보 업데이트:', infoData);
      return true;
    }

    console.log('모임 소개 정보 업데이트 시작:', infoData);
    const docRef = doc(db, 'settings', 'groupInfo');
    
    // 마지막 업데이트 시간 추가
    const dataToUpdate = {
      ...infoData,
      lastUpdated: new Date().toISOString()
    };
    
    await setDoc(docRef, dataToUpdate);
    console.log('모임 소개 정보 업데이트 완료');
    return true;
  } catch (error) {
    console.error('모임 소개 정보 업데이트 오류:', error);
    throw error;
  }
};

// 새로운 함수 추가: 이메일 링크를 통한 계정 생성
export const createUserWithEmail = async (email, password, userData) => {
  try {
    console.log(`createUserWithEmail 함수 실행 - 환경: ${isDevelopment ? '개발' : '프로덕션'}`);
    
    if (isDevelopment) {
      // 개발 환경에서는 모의 응답
      try {
        await mockCreateUser(email);
        await mockSendPasswordReset(null, email);
        
        return { success: true };
      } catch (mockError) {
        console.error('개발 환경 - 계정 생성 실패:', mockError);
        throw mockError;
      }
    }

    // Firebase Authentication에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore에 사용자 데이터 저장
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      name: userData.name,
      role: userData.role,
      createdAt: new Date().toISOString()
    });
    
    console.log('계정 생성 프로세스 완료:', { uid: user.uid, email: user.email });
    return { success: true };
  } catch (error) {
    console.error('계정 생성 중 오류 발생:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('이미 사용 중인 이메일입니다.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('유효하지 않은 이메일 형식입니다.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('비밀번호가 너무 약합니다.');
    }
    throw error;
  }
}; 