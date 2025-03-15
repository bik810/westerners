import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { changePassword } from '../lib/firestoreService';
import { useAuth } from '../lib/authContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const { redirect } = router.query;

  // 로그인하지 않은 경우 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!currentUser && !loading) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await changePassword(currentUser, password);
      
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      
      // 리디렉션 처리
      setTimeout(() => {
        if (redirect) {
          // URL 디코딩하여 원래 가려던 페이지로 이동
          router.push(decodeURIComponent(redirect));
        } else {
          // 그 외의 경우 홈으로 이동
          router.push('/');
        }
      }, 2000);
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        setError('보안을 위해 다시 로그인해주세요.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Westerners - 비밀번호 변경</title>
        <meta name="description" content="Westerners 모임 비밀번호 변경" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* 타이틀 섹션 */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">비밀번호 변경</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            {userProfile?.isFirstLogin 
              ? '첫 로그인 시 비밀번호를 변경해주세요' 
              : '새로운 비밀번호를 설정해주세요'}
          </p>
        </div>
      </section>

      {/* 내용 섹션 */}
      <section className="py-10 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-5 md:p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative animate-pulse mb-6">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative animate-pulse mb-6">
                  {success}
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      새 비밀번호
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none relative block w-full px-4 py-3 md:py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base sm:text-sm transition-all duration-200"
                      placeholder="새 비밀번호를 입력하세요"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">최소 6자 이상이어야 합니다</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      비밀번호 확인
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none relative block w-full px-4 py-3 md:py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base sm:text-sm transition-all duration-200"
                      placeholder="비밀번호를 다시 입력하세요"
                      required
                    />
                  </div>
                </div>

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
                        처리 중...
                      </>
                    ) : (
                      '비밀번호 변경'
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