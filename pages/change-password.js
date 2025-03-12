import { useState } from 'react';
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

  // 로그인하지 않은 경우 로그인 페이지로 리디렉션
  if (!currentUser) {
    router.push('/login');
    return null;
  }

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
      
      await changePassword(password);
      
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      
      // 첫 로그인이 아닌 경우 3초 후 홈으로 리디렉션
      if (!userProfile?.isFirstLogin) {
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
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

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Westerners - 비밀번호 변경</title>
        <meta name="description" content="Westerners 모임 비밀번호 변경" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <section className="pt-32 pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">비밀번호 변경</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            {userProfile?.isFirstLogin 
              ? '첫 로그인 시 비밀번호를 변경해주세요' 
              : '새로운 비밀번호를 설정해주세요'}
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-grow">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">비밀번호 변경</h2>
                <p className="text-gray-600 mt-2">
                  {userProfile?.isFirstLogin 
                    ? '보안을 위해 비밀번호를 변경해주세요' 
                    : '새로운 비밀번호를 입력해주세요'}
                </p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                  <span className="block sm:inline">{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    새 비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? '처리 중...' : '비밀번호 변경'}
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