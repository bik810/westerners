import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
const signOutFunc = isDevelopment ? mockAuthModule.signOut : signOut;

// 자동 로그아웃 타임아웃 설정 (30분 = 1800000 밀리초)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 인증 컨텍스트 제공자 컴포넌트
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inactivityTimer, setInactivityTimer] = useState(null);
  const router = useRouter();

  // 사용자 활동 감지 및 타이머 재설정 함수
  const resetInactivityTimer = () => {
    if (currentUser) {
      // 기존 타이머가 있으면 제거
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // 새 타이머 설정
      const newTimer = setTimeout(() => {
        console.log('비활성 시간 초과로 자동 로그아웃');
        handleLogout();
      }, INACTIVITY_TIMEOUT);
      
      setInactivityTimer(newTimer);
    }
  };
  
  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await signOutFunc(authInstance);
      // 로그아웃 후 타이머 제거
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        setInactivityTimer(null);
      }
      
      // 홈 페이지로 이동하고 자동 로그아웃 메시지 표시
      // 프로덕션 환경에서 router.push가 문제를 일으킬 수 있으므로 window.location을 사용
      if (typeof window !== 'undefined') {
        window.location.href = '/?message=자동 로그아웃되었습니다. 다시 로그인해주세요.';
      } else {
        router.push('/?message=자동 로그아웃되었습니다. 다시 로그인해주세요.');
      }
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  // 사용자 활동 이벤트 리스너 등록
  useEffect(() => {
    if (currentUser && !isDevelopment) {
      // 개발 환경이 아닌 경우에만 자동 로그아웃 기능 활성화
      // 사용자 활동 이벤트 리스너 등록
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const handleUserActivity = () => {
        resetInactivityTimer();
      };
      
      // 이벤트 리스너 등록
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // 초기 타이머 설정
      resetInactivityTimer();
      
      // 컴포넌트 언마운트 시 이벤트 리스너 및 타이머 제거
      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
        
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
      };
    }
  }, [currentUser, inactivityTimer, isDevelopment]);

  // 인증 상태 변경 감지
  useEffect(() => {
    console.log(`현재 환경: ${isDevelopment ? '개발' : '프로덕션'}`);
    
    const unsubscribe = authStateChanged(authInstance, async (user) => {
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
  }, [router]);

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
    isDevelopment, // 개발 환경 여부도 컨텍스트에 포함
    resetInactivityTimer // 활동 타이머 재설정 함수 노출
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