import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { getUserById } from './firestoreService';
import { useRouter } from 'next/router';

// 개발 환경에서는 모의 인증 모듈 사용
import mockAuthModule, { mockUserProfile, onAuthStateChanged as mockOnAuthStateChanged, mockGetUserById } from './mockAuth';

// 개발 환경 여부 확인
const isDevelopment = process.env.NODE_ENV === 'development';

// 환경에 따라 적절한 인증 함수 선택
const authStateChanged = isDevelopment ? mockOnAuthStateChanged : onAuthStateChanged;
const authInstance = isDevelopment ? mockAuthModule.mockAuth : auth;
const getUserByIdFunc = isDevelopment ? mockGetUserById : getUserById;

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 인증 컨텍스트 제공자 컴포넌트
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 인증 상태 변경 감지
  useEffect(() => {
    console.log(`현재 환경: ${isDevelopment ? '개발' : '프로덕션'}`);
    
    const unsubscribe = authStateChanged(authInstance, async (user) => {
      console.log('인증 상태 변경 감지:', user?.email || '로그인 안 됨');
      
      // 새 사용자 생성 중 발생하는 일시적인 인증 상태 변경인지 확인
      const isTemporaryAuth = user && 
        router.pathname === '/admin/members' && 
        currentUser && 
        user.email !== currentUser.email;
      
      if (isTemporaryAuth) {
        console.log('관리자 기능 실행 중 임시 인증 상태 감지. 상태 업데이트 건너뜀.');
        return; // 임시 인증 상태 변경 무시
      }
      
      setCurrentUser(user);
      
      if (user) {
        try {
          // Firestore에서 사용자 프로필 정보 가져오기
          const profile = await getUserByIdFunc(user.uid);
          setUserProfile(profile);
          
          // 개발 환경에서는 콘솔에 사용자 정보 출력
          if (isDevelopment) {
            console.log('개발 환경 - 현재 사용자:', user);
            console.log('개발 환경 - 사용자 프로필:', profile);
          }
          
          // 최초 로그인 시 비밀번호 변경 유도 기능 제거
          // 사용자가 원할 때 직접 비밀번호를 변경할 수 있도록 함
        } catch (error) {
          console.error('사용자 프로필 로드 중 오류 발생:', error);
          setUserProfile(null); // 오류 발생 시 프로필을 null로 설정
        }
      } else {
        setUserProfile(null);
        
        // 로그인이 필요한 페이지에 접근하려고 할 때 로그인 페이지로 리디렉션
        const publicPaths = ['/', '/login', '/change-password', '/unauthorized'];
        const isPublicPath = publicPaths.includes(router.pathname) || 
                            router.pathname.startsWith('/_') || 
                            router.pathname.includes('/_next/') ||
                            router.pathname.includes('/api/');
        
        if (!isPublicPath && !isDevelopment) {
          console.log('비로그인 사용자 리디렉션: ', router.pathname, ' -> /login');
          // 현재 경로를 redirect 파라미터로 전달
          const currentPath = router.asPath;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, currentUser]);

  // 사용자 권한 확인 함수
  const hasPermission = (requiredRole) => {
    if (!userProfile) return false;
    
    const roleHierarchy = {
      'admin': 3,
      'treasurer': 2,
      'member': 1
    };
    
    const userRoleLevel = roleHierarchy[userProfile.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    hasPermission,
    isDevelopment // 개발 환경 여부도 컨텍스트에 포함
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 인증 컨텍스트 사용을 위한 훅
export function useAuth() {
  return useContext(AuthContext);
} 