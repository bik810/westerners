import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';

export default function ProtectedRoute({ children, requiredRole = 'member' }) {
  const { currentUser, userProfile, loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // 로그인하지 않은 경우
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      // 권한이 없는 경우
      if (!hasPermission(requiredRole)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [currentUser, userProfile, loading, hasPermission, requiredRole, router]);

  // 로딩 중이거나 권한 확인 중인 경우 로딩 표시
  if (loading || !currentUser || !hasPermission(requiredRole)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return children;
} 