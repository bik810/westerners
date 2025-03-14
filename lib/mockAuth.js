// 로컬 개발 환경에서 사용할 모의 인증 모듈
// Firebase 인증을 시뮬레이션하는 함수들을 제공합니다.

// 모의 사용자 데이터 - 기본 관리자 계정
const mockAdminUser = {
  uid: 'local-admin-user',
  email: 'admin@westerners.com',
  emailVerified: true,
  displayName: '관리자',
  isAnonymous: false,
  providerData: [
    {
      providerId: 'password',
      uid: 'admin@westerners.com',
      displayName: '관리자',
      email: 'admin@westerners.com',
      phoneNumber: null,
      photoURL: null
    }
  ],
  stsTokenManager: {
    refreshToken: 'mock-refresh-token',
    accessToken: 'mock-access-token',
    expirationTime: Date.now() + 3600 * 1000
  },
  createdAt: '1614698598570',
  lastLoginAt: '1614698598570'
};

// 모의 사용자 데이터 - 총무 계정
const mockTreasurerUser = {
  uid: 'local-treasurer-user',
  email: 'treasurer@westerners.com',
  emailVerified: true,
  displayName: '총무',
  isAnonymous: false,
  providerData: [
    {
      providerId: 'password',
      uid: 'treasurer@westerners.com',
      displayName: '총무',
      email: 'treasurer@westerners.com',
      phoneNumber: null,
      photoURL: null
    }
  ],
  stsTokenManager: {
    refreshToken: 'mock-refresh-token',
    accessToken: 'mock-access-token',
    expirationTime: Date.now() + 3600 * 1000
  },
  createdAt: '1614698598570',
  lastLoginAt: '1614698598570'
};

// 모의 사용자 데이터 - 일반 회원 계정
const mockMemberUser = {
  uid: 'local-member-user',
  email: 'member@westerners.com',
  emailVerified: true,
  displayName: '일반회원',
  isAnonymous: false,
  providerData: [
    {
      providerId: 'password',
      uid: 'member@westerners.com',
      displayName: '일반회원',
      email: 'member@westerners.com',
      phoneNumber: null,
      photoURL: null
    }
  ],
  stsTokenManager: {
    refreshToken: 'mock-refresh-token',
    accessToken: 'mock-access-token',
    expirationTime: Date.now() + 3600 * 1000
  },
  createdAt: '1614698598570',
  lastLoginAt: '1614698598570'
};

// 모의 사용자 프로필 데이터 - 관리자
export const mockAdminProfile = {
  id: 'local-admin-user',
  email: 'admin@westerners.com',
  name: '관리자',
  role: 'admin',
  isFirstLogin: false
};

// 모의 사용자 프로필 데이터 - 총무
export const mockTreasurerProfile = {
  id: 'local-treasurer-user',
  email: 'treasurer@westerners.com',
  name: '총무',
  role: 'treasurer',
  isFirstLogin: false
};

// 모의 사용자 프로필 데이터 - 일반 회원
export const mockMemberProfile = {
  id: 'local-member-user',
  email: 'member@westerners.com',
  name: '일반회원',
  role: 'member',
  isFirstLogin: false
};

// 기본 사용자 (로그인하지 않은 상태로 시작)
let mockUser = null;
let mockUserProfile = null;

// 테스트용 사용자 계정 목록
const testAccounts = {
  'admin': {
    user: mockAdminUser,
    profile: mockAdminProfile,
    password: 'admin123'
  },
  'treasurer': {
    user: mockTreasurerUser,
    profile: mockTreasurerProfile,
    password: 'treasurer123'
  },
  'member': {
    user: mockMemberUser,
    profile: mockMemberProfile,
    password: 'member123'
  }
};

// 인증 상태 변경 리스너 목록
const authStateListeners = [];

// 모의 onAuthStateChanged 함수
export const onAuthStateChanged = (auth, callback) => {
  // 리스너 목록에 콜백 추가
  authStateListeners.push(callback);
  
  // 즉시 현재 모의 사용자로 콜백 호출
  setTimeout(() => {
    callback(mockUser);
  }, 100);
  
  // 구독 해제 함수 반환
  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index !== -1) {
      authStateListeners.splice(index, 1);
    }
  };
};

// 모든 리스너에게 인증 상태 변경 알림
const notifyAuthStateChange = (user) => {
  authStateListeners.forEach(callback => {
    try {
      callback(user);
    } catch (error) {
      console.error('인증 상태 변경 리스너 호출 중 오류:', error);
    }
  });
};

// 모의 로그인 함수
export const signInWithEmailAndPassword = async (auth, email, password) => {
  // 간단한 유효성 검사 시뮬레이션
  if (!email || !password) {
    throw new Error('이메일과 비밀번호를 입력해주세요.');
  }
  
  // 테스트 계정 확인
  const userId = email.split('@')[0]; // 이메일에서 사용자 ID 추출
  
  if (testAccounts[userId]) {
    // 비밀번호 확인
    if (testAccounts[userId].password === password) {
      // 로그인 성공
      mockUser = testAccounts[userId].user;
      mockUserProfile = testAccounts[userId].profile;
      console.log(`모의 로그인 성공: ${userId} (${testAccounts[userId].profile.role})`);
      
      // 인증 상태 변경 알림
      setTimeout(() => {
        notifyAuthStateChange(mockUser);
        // mockAuth 객체 업데이트
        mockAuth.currentUser = mockUser;
      }, 100);
      
      return { user: mockUser };
    } else {
      // 비밀번호 불일치
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
  } else {
    // 사용자 ID 불일치
    throw new Error('존재하지 않는 사용자입니다.');
  }
};

// 모의 로그아웃 함수
export const signOut = async (auth) => {
  mockUser = null;
  mockUserProfile = null;
  console.log('모의 로그아웃 성공');
  
  // 인증 상태 변경 알림
  setTimeout(() => {
    notifyAuthStateChange(null);
    // mockAuth 객체 업데이트
    mockAuth.currentUser = null;
  }, 100);
  
  return Promise.resolve();
};

// 모의 비밀번호 변경 함수
export const updatePassword = async (user, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
  }
  console.log('모의 비밀번호 변경 성공');
  return Promise.resolve();
};

// 모의 비밀번호 재설정 이메일 전송 함수
export const sendPasswordResetEmail = async (auth, email) => {
  if (!email) {
    throw new Error('이메일을 입력해주세요.');
  }
  console.log(`${email}로 모의 비밀번호 재설정 이메일 전송 성공`);
  return Promise.resolve();
};

// 모의 인증 객체
export const mockAuth = {
  currentUser: mockUser
};

// 모의 createUserWithEmailAndPassword 함수
export const createUserWithEmailAndPassword = async (auth, email, password) => {
  if (!email || !password) {
    throw new Error('이메일과 비밀번호를 입력해주세요.');
  }
  
  if (password.length < 6) {
    throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
  }
  
  const newUser = {
    ...mockAdminUser,
    email,
    uid: `local-${Date.now()}`,
    providerData: [
      {
        ...mockAdminUser.providerData[0],
        email
      }
    ]
  };
  
  return {
    user: newUser
  };
};

// 모의 getUserById 함수 (Firestore 서비스에서 사용)
export const mockGetUserById = async (userId) => {
  // 현재 로그인된 사용자의 프로필 반환
  if (mockUserProfile && mockUserProfile.id === userId) {
    return mockUserProfile;
  }
  
  // 테스트 계정 중에서 찾기
  for (const key in testAccounts) {
    if (testAccounts[key].user.uid === userId) {
      return testAccounts[key].profile;
    }
  }
  
  // 기본값 반환
  return {
    id: userId,
    email: `${userId}@westerners.com`,
    name: '테스트 사용자',
    role: 'member',
    isFirstLogin: false
  };
};

// 모의 getAllUsers 함수 (Firestore 서비스에서 사용)
export const mockGetAllUsers = async () => {
  return [
    mockAdminProfile,
    mockTreasurerProfile,
    mockMemberProfile,
    {
      id: 'local-member-1',
      email: 'member1@westerners.com',
      name: '회원1',
      role: 'member',
      isFirstLogin: false
    },
    {
      id: 'local-member-2',
      email: 'member2@westerners.com',
      name: '회원2',
      role: 'member',
      isFirstLogin: false
    }
  ];
};

export default {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  mockAuth,
  mockUserProfile,
  mockGetUserById,
  mockGetAllUsers,
  testAccounts
}; 