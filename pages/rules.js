import Head from 'next/head';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Rules() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Westerners - 회칙</title>
        <meta name="description" content="Westerners 모임의 회칙" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Westerners 회칙</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            우리 모임의 원활한 운영을 위한 규칙과 규정을 안내합니다
          </p>
        </div>
      </section>

      {/* Rules Content */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex flex-wrap border-b">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'general'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                제 1 장 총칙
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'members'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                제 2 장 회원
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'finance'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                제 3 장 재정
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* General Rules */}
              {activeTab === 'general' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">제 1 조 (명칭)</h3>
                    <p className="text-gray-600 leading-relaxed">
                      본 모임은 "Westerners"라 칭한다.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">제 2 조 (목적)</h3>
                    <p className="text-gray-600 leading-relaxed">
                      본 모임은 회원 간의 친목 도모와 정보 교류를 목적으로 한다.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">제 3 조 (활동)</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      본 모임은 목적 달성을 위해 다음과 같은 활동을 한다.
                    </p>
                    <ol className="list-decimal list-inside ml-4 space-y-2 text-gray-600">
                      <li className="pl-2">정기 모임 개최</li>
                      <li className="pl-2">회원 간 정보 교류</li>
                      <li className="pl-2">기타 목적 달성에 필요한 활동</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Member Rules */}
              {activeTab === 'members' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">제 4 조 (회원 자격)</h3>
                    <p className="text-gray-600 leading-relaxed">
                      본 모임의 목적에 동의하고 활동에 참여하고자 하는 사람은 회원이 될 수 있다.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">제 5 조 (회원의 권리와 의무)</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      회원은 다음과 같은 권리와 의무를 가진다.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-lg mb-3 text-blue-800">권리</h4>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                          <li className="pl-2">모임의 활동에 참여할 권리</li>
                          <li className="pl-2">모임의 운영에 관한 의견을 제시할 권리</li>
                        </ul>
                      </div>
                      <div className="bg-red-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-lg mb-3 text-red-800">의무</h4>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                          <li className="pl-2">회비를 납부할 의무</li>
                          <li className="pl-2">회칙을 준수할 의무</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Finance Rules */}
              {activeTab === 'finance' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">제 6 조 (회비)</h3>
                    <p className="text-gray-600 leading-relaxed">
                      회원은 월 10,000원의 회비를 납부한다.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">제 7 조 (회계)</h3>
                    <p className="text-gray-600 leading-relaxed">
                      모임의 재정은 회비, 후원금 등으로 충당하며, 회계 내역은 정기적으로 공개한다.
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mt-8">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-yellow-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <h4 className="font-semibold text-lg mb-2 text-gray-800">회비 납부 안내</h4>
                        <p className="text-gray-600">
                          회비는 매월 5일까지 납부해 주시기 바랍니다. 회비 납부 현황은 '회비 관리' 페이지에서 확인하실 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
} 