import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Westerners - 접근 권한 없음</title>
        <meta name="description" content="Westerners 모임 접근 권한 없음" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow flex items-center justify-center bg-gradient-to-r from-red-900 via-red-800 to-red-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-md w-full space-y-8 bg-white bg-opacity-95 backdrop-filter backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
          <div className="text-center">
            <h2 className="mt-2 text-center text-4xl font-extrabold text-gray-900">
              <span className="text-red-600">W</span>esterners
            </h2>
            <h3 className="mt-2 text-center text-2xl font-bold text-gray-800">
              접근 권한 없음
            </h3>
            
            <div className="mt-6 mb-6">
              <svg className="w-20 h-20 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            
            <p className="text-gray-600 mb-8">
              이 페이지에 접근하기 위한 권한이 없습니다. 필요한 권한이 있다고 생각되면 관리자에게 문의하세요.
            </p>
            
            <button
              onClick={() => router.push('/')}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.02] shadow-md"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 