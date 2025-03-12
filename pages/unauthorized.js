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

      <section className="pt-32 pb-20 bg-gradient-to-r from-red-900 to-red-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">접근 권한 없음</h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto">
            이 페이지에 접근할 수 있는 권한이 없습니다
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-grow">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="mb-6">
                <svg className="w-20 h-20 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">접근 권한이 없습니다</h2>
              
              <p className="text-gray-600 mb-8">
                이 페이지에 접근하기 위한 권한이 없습니다. 필요한 권한이 있다고 생각되면 관리자에게 문의하세요.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 