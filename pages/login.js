import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { loginUser } from '../lib/firestoreService';
import { useAuth } from '../lib/authContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { currentUser } = useAuth();

  // 이미 로그인한 경우 홈으로 리디렉션
  if (currentUser) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await loginUser(email, password);
      router.push('/');
    } catch (error) {
      console.error('로그인 오류:', error);
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
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

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Westerners - 로그인</title>
        <meta name="description" content="Westerners 모임 로그인" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <section className="pt-32 pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">로그인</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Westerners 모임 회원 전용 페이지입니다
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-grow">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">회원 로그인</h2>
                <p className="text-gray-600 mt-2">계정 정보를 입력해주세요</p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    사용자 ID
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="사용자 ID를 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="비밀번호를 입력하세요"
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
                    {loading ? '로그인 중...' : '로그인'}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>관리자 계정: bik810</p>
                <p className="mt-1">첫 로그인 시 비밀번호를 변경해주세요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 