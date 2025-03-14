import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { loginUser } from '../lib/firestoreService';
import { useAuth } from '../lib/authContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

// 개발 환경 여부 확인
const isDevelopment = process.env.NODE_ENV === 'development';

// 테스트 계정 정보
const testAccounts = [
  { id: 'admin', password: 'admin123', role: '관리자' },
  { id: 'treasurer', password: 'treasurer123', role: '총무' },
  { id: 'member', password: 'member123', role: '일반 회원' }
];

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { currentUser, isDevelopment: isDevEnv } = useAuth();
  const { redirect } = router.query;

  // 이미 로그인한 경우 홈 또는 원래 가려던 페이지로 리디렉션
  useEffect(() => {
    if (currentUser) {
      if (redirect) {
        router.push(decodeURIComponent(redirect));
      } else {
        router.push('/');
      }
    }
  }, [currentUser, redirect, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId || !password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // 사용자 ID를 이메일로 변환 (개발 환경에서는 그대로 사용)
      const email = isDevEnv ? userId : `${userId}@westerners.com`;
      
      console.log(`로그인 시도: ${email} (${isDevEnv ? '개발 환경' : '프로덕션 환경'})`);
      await loginUser(email, password);
      
      // 로그인 성공 후 리디렉션은 useEffect에서 처리됨
    } catch (error) {
      console.error('로그인 오류:', error);
      
      if (isDevelopment) {
        // 개발 환경에서는 더 자세한 오류 메시지 표시
        setError(`로그인 오류: ${error.message}`);
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 테스트 계정으로 자동 입력
  const fillTestAccount = (account) => {
    setUserId(account.id);
    setPassword(account.password);
  };

  if (currentUser) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Westerners - 로그인</title>
        <meta name="description" content="Westerners 모임 로그인" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              로그인
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Westerners 모임 회원 전용 페이지입니다
            </p>
            {isDevelopment && (
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded text-sm">
                <p className="font-bold mb-2">개발 환경 테스트 계정</p>
                <div className="space-y-2">
                  {testAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center p-2 bg-white rounded border border-yellow-300">
                      <div>
                        <span className="font-medium">{account.role}:</span> {account.id} / {account.password}
                      </div>
                      <button
                        type="button"
                        onClick={() => fillTestAccount(account)}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                      >
                        사용
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-700">* 클릭하면 자동으로 입력됩니다</p>
              </div>
            )}
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="userId" className="sr-only">아이디</label>
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="아이디"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading ? (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
} 