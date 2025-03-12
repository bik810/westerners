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
          if (profile && profile.isFirstLogin && router.pathname !== '/change-password') {
            router.push('/change-password');
          }
        } catch (error) {
          console.error('사용자 프로필 로드 중 오류 발생:', error);
        }
      } else {
        setUserProfile(null);
        
        // 로그인이 필요한 페이지에 접근하려고 할 때 로그인 페이지로 리디렉션
        const publicPaths = ['/', '/login', '/change-password'];
        if (!publicPaths.includes(router.pathname)) {
          router.push('/login');
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
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 인증 컨텍스트 사용을 위한 훅
export function useAuth() {
  return useContext(AuthContext);
} 