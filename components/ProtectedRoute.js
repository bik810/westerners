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
      
      // requiredRole이 null이 아니고 권한이 없는 경우에만 권한 체크
      if (requiredRole !== null && !hasPermission(requiredRole)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [currentUser, userProfile, loading, hasPermission, requiredRole, router]);

  // 로딩 중이거나 로그인하지 않은 경우
  if (loading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // requiredRole이 null이 아니고 권한이 없는 경우
  if (requiredRole !== null && !hasPermission(requiredRole)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return children;
} 