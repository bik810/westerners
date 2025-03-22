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
export const createUser = async (email, password, userData, adminCredentials) => {
  try {
    // 현재 로그인된 관리자 정보 저장
    const adminEmail = adminCredentials?.email;
    const adminPassword = adminCredentials?.password;
    
    if (!adminEmail || !adminPassword) {
      console.error('관리자 정보가 제공되지 않았습니다.');
    }
    
    if (isDevelopment) {
      console.log('개발 환경 - 모의 사용자 생성:', email, userData);
      const userCredential = await mockCreateUser(null, email, password);
      const user = userCredential.user;
      
      // 사용자 정보를 모의 데이터에 저장
      console.log('개발 환경 - 모의 사용자 정보 저장:', user.uid, userData);
      
      // 개발 환경에서는 관리자로 자동 로그인 처리
      if (adminEmail && adminPassword) {
        console.log('개발 환경 - 관리자 계정으로 다시 로그인:', adminEmail);
        await mockSignIn(null, adminEmail, adminPassword);
      }
      
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
    
    // 사용자 생성 후 관리자 계정으로 다시 로그인
    if (adminEmail && adminPassword) {
      console.log('관리자 계정으로 다시 로그인 처리 중...');
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    }
    
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

// 새로운 함수 추가: 이메일 링크를 통한 계정 생성
export const createUserWithEmail = async (email, userData) => {
  try {
    console.log(`createUserWithEmail 함수 실행 - 환경: ${isDevelopment ? '개발' : '프로덕션'}`);
    
    if (isDevelopment) {
      console.log('개발 환경 - 모의 사용자 생성 (이메일 링크):', email, userData);
      
      // 개발 환경에서는 간단히 모의 데이터로 처리
      const randomPassword = Math.random().toString(36).slice(-8);
      console.log('mockCreateUser 함수 호출 전:', { email, randomPassword: '***' });
      
      try {
        const userCredential = await mockCreateUser(null, email, randomPassword);
        const user = userCredential.user;
        
        console.log('개발 환경 - 모의 사용자 정보 저장:', user.uid, userData);
        console.log('개발 환경 - 비밀번호 재설정 이메일 전송 (모의):', email);
        
        return user;
      } catch (mockError) {
        // 개발 환경에서도 이메일 중복 등의 오류를 시뮬레이션
        console.error('개발 환경 - 모의 사용자 생성 오류:', mockError);
        
        if (mockError.code === 'auth/email-already-in-use') {
          throw new Error('이미 사용 중인 이메일입니다. 다른 이메일 주소를 사용해주세요.');
        }
        throw mockError;
      }
    }

    // 임시 랜덤 비밀번호 생성 (사용자가 실제 사용할 비밀번호는 아니지만 계정 생성용)
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    console.log('Firebase 인증 함수 호출 전:', { email, auth: auth ? '정의됨' : '미정의' });
    
    // Firebase Authentication에 임시 비밀번호로 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
    const user = userCredential.user;
    
    console.log('사용자 인증 성공, Firestore에 정보 저장 중:', user.uid);
    
    // Firestore에 사용자 정보 저장
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email: user.email,
      createdAt: new Date().toISOString()
    });
    
    console.log('Firestore 저장 성공, 비밀번호 재설정 이메일 전송 중:', email);
    
    // 비밀번호 재설정 이메일 즉시 전송
    await sendPasswordResetEmail(auth, email);
    
    console.log('비밀번호 재설정 이메일 전송 성공, 관리자 세션 유지를 위해 로그아웃');
    
    // 현재 관리자로 다시 로그인 (createUserWithEmailAndPassword가 자동 로그인되기 때문)
    // 관리자 세션으로 유지하기 위해 로그아웃
    await signOut(auth);
    
    console.log('계정 생성 프로세스 완료:', { uid: user.uid, email: user.email });
    
    return user;
  } catch (error) {
    console.error('이메일 링크로 사용자 생성 중 오류 발생:', error);
    
    // Firebase 오류 코드에 따른 사용자 친화적인 메시지 반환
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('이미 사용 중인 이메일입니다. 다른 이메일 주소를 사용해주세요.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('유효하지 않은 이메일 형식입니다. 올바른 이메일 주소를 입력해주세요.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('이메일/비밀번호 인증이 활성화되지 않았습니다. 관리자에게 문의하세요.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('보안에 취약한 비밀번호입니다. 더 강력한 비밀번호를 사용해주세요.');
    } else if (error.code) {
      // 기타 Firebase 오류
      throw new Error(`계정 생성 실패: ${error.message} (${error.code})`);
    } else {
      // 일반 오류
      throw error;
    }
  }
}; 