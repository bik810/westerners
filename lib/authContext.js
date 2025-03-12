import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { getUserById } from './firestoreService';
import { useRouter } from 'next/router';

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Firestore에서 사용자 프로필 정보 가져오기
          const profile = await getUserById(user.uid);
          setUserProfile(profile);
          
          // 첫 로그인이면 비밀번호 변경 페이지로 이동
          // 단, 다음 조건에 해당하는 경우 리디렉션하지 않음:
          // 1. 이미 비밀번호 변경 페이지에 있는 경우
          // 2. 관리자가 회원 관리 페이지에 있는 경우
          // 3. 비밀번호 변경 페이지로 이동하는 중인 경우
          if (profile && profile.isFirstLogin && 
              router.pathname !== '/change-password' && 
              !router.asPath.includes('/change-password')) {
            
            // 관리자가 회원 관리 페이지에 있는 경우 리디렉션하지 않음
            const isAdminOnMembersPage = profile.role === 'admin' && router.pathname === '/admin/members';
            
            if (!isAdminOnMembersPage) {
              console.log('첫 로그인 사용자 리디렉션: ', router.pathname, ' -> /change-password');
              // 현재 경로를 redirect 파라미터로 전달
              const currentPath = router.asPath;
              router.push(`/change-password?redirect=${encodeURIComponent(currentPath)}`);
            }
          }
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
        
        if (!isPublicPath) {
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
    hasPermission
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