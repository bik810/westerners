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
  { email: 'admin@westerners.com', password: 'admin123', role: '관리자' },
  { email: 'treasurer@westerners.com', password: 'treasurer123', role: '총무' },
  { email: 'member@westerners.com', password: 'member123', role: '일반 회원' }
];

export default function Login() {
  const [email, setEmail] = useState('');
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
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      console.log(`로그인 시도: ${email} (${isDevEnv ? '개발 환경' : '프로덕션 환경'})`);
      await loginUser(email, password);
      
      // 로그인 성공 후 리디렉션은 useEffect에서 처리됨
    } catch (error) {
      console.error('로그인 오류:', error);
      
      if (isDevelopment) {
        // 개발 환경에서는 더 자세한 오류 메시지 표시
        setError(`로그인 오류: ${error.message}`);
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
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
    setEmail(account.email);
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

      {/* 타이틀 섹션 */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Westerners 로그인</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            Westerners 모임 회원 전용 페이지입니다
          </p>
        </div>
      </section>

      {/* 내용 섹션 */}
      <section className="py-10 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-5 md:p-8">
              {isDevelopment && (
                <div className="mb-6 md:mb-8 p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
                  <p className="font-bold mb-2 text-yellow-800">개발 환경 테스트 계정</p>
                  <div className="space-y-2">
                    {testAccounts.map((account) => (
                      <div key={account.email} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white rounded-lg border border-yellow-100 shadow-sm transition-all duration-200 hover:shadow-md">
                        <div className="mb-2 sm:mb-0">
                          <span className="font-medium text-gray-700">{account.role}:</span> 
                          <span className="ml-1 text-gray-600 break-all">{account.email} / {account.password}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => fillTestAccount(account)}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-all duration-200 transform hover:scale-105 shadow-sm w-full sm:w-auto mt-1 sm:mt-0"
                        >
                          사용
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-600">* 클릭하면 자동으로 입력됩니다</p>
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="appearance-none relative block w-full px-4 py-3 md:py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base sm:text-sm transition-all duration-200"
                      placeholder="이메일 주소를 입력하세요"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="appearance-none relative block w-full px-4 py-3 md:py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base sm:text-sm transition-all duration-200"
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative animate-pulse">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`group relative w-full flex justify-center py-3 md:py-4 px-4 border border-transparent text-base sm:text-sm font-medium rounded-lg text-white ${
                      loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.02] shadow-md`}
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
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 