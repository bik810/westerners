import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../lib/authContext';
import { getCurrentExecutive, getGroupInfo, updateGroupInfo } from '../lib/firestoreService';

export default function Home() {
  const { currentUser, userProfile } = useAuth();
  const [currentExecutive, setCurrentExecutive] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [introText, setIntroText] = useState("");
  const [activityText, setActivityText] = useState("");
  
  // 권한 확인 함수
  const canEdit = userProfile && (userProfile.role === 'admin' || userProfile.role === 'treasurer');
  
  // 임원단 정보와 모임 소개 정보 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('데이터 로딩 시작...');
        
        const [executiveData, groupInfoData] = await Promise.all([
          getCurrentExecutive(),
          getGroupInfo()
        ]);
        
        console.log('임원단 데이터:', executiveData);
        console.log('모임 소개 데이터:', groupInfoData);
        
        setCurrentExecutive(executiveData);
        
        if (groupInfoData) {
          setIntroText(groupInfoData.intro || "");
          setActivityText(groupInfoData.activity || "");
        }
      } catch (err) {
        console.error('데이터 로드 중 오류:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 모임 소개 정보 업데이트 처리
  const handleIntroUpdate = async () => {
    try {
      await updateGroupInfo({
        intro: introText,
        activity: activityText
      });
      setIsIntroModalOpen(false);
      alert('모임 소개가 업데이트되었습니다.');
    } catch (err) {
      console.error('모임 소개 업데이트 중 오류:', err);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };
  
  // 활동 내용 업데이트 처리
  const handleActivityUpdate = async () => {
    try {
      await updateGroupInfo({
        intro: introText,
        activity: activityText
      });
      setIsActivityModalOpen(false);
      alert('활동 내용이 업데이트되었습니다.');
    } catch (err) {
      console.error('활동 내용 업데이트 중 오류:', err);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Westerners - 홈</title>
        <meta name="description" content="Westerners 모임 웹사이트" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        {/* 배경 효과 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black opacity-40"></div>
          
          {/* 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/30 to-black opacity-70"></div>
          
          {/* 움직이는 그라데이션 효과 */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-0 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-40 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight animate-fade-in-up">
            <span className="text-blue-400 inline-block animate-pulse-slow">W</span>esterners에 오신 것을 환영합니다
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 md:mb-12 animate-fade-in-up animation-delay-300">
            싱가포르에서 함께 고생하며 일하는 사람들이 모여 만든 커뮤니티입니다. 정기모임을 통해 돈독한 우정을 나누고 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-5 animate-fade-in-up animation-delay-600">
            {currentUser ? (
              // 로그인한 사용자에게 표시할 버튼
              <>
                <Link href="/group-info" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 md:py-4 px-7 md:px-9 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-600/30 flex items-center justify-center">
                  <span>모임 정보</span>
                  <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </Link>
                <Link href="/gallery" className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-3 md:py-4 px-7 md:px-9 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center">
                  <span>갤러리</span>
                  <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </Link>
                <Link href="/fees" className="bg-green-600 hover:bg-green-500 text-white font-semibold py-3 md:py-4 px-7 md:px-9 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-600/30 flex items-center justify-center">
                  <span>회비 관리</span>
                  <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </Link>
                {userProfile && userProfile.role === 'admin' && (
                  <Link href="/admin/members" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 md:py-4 px-7 md:px-9 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-600/30 flex items-center justify-center">
                    <span>계정 관리</span>
                    <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </Link>
                )}
              </>
            ) : (
              // 로그인하지 않은 사용자에게 표시할 버튼
              <Link href="/login" className="bg-white hover:bg-blue-50 text-blue-700 font-semibold py-3 md:py-4 px-7 md:px-9 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-white/30 flex items-center justify-center">
                <span>로그인</span>
                <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
              </Link>
            )}
          </div>
        </div>
        <div className="absolute bottom-6 md:bottom-10 left-0 right-0 flex justify-center animate-bounce-slow">
          <a href="#next-meeting" className="text-white hover:text-blue-300 transition-colors duration-300 transform hover:scale-110">
            <svg className="w-7 h-7 md:w-9 md:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </a>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
            {/* 임원단 카드 */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
              <div className="h-2 md:h-3 bg-gradient-to-r from-blue-500 to-blue-700"></div>
              <div className="p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 md:mb-8 mx-auto transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-5 text-center">현 임원단</h3>
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : !currentUser ? (
                  <div className="text-center py-4">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">로그인이 필요합니다</h3>
                    <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <span>로그인하기</span>
                    </Link>
                  </div>
                ) : currentExecutive ? (
                  <div className="flex flex-col">
                    <div className="bg-blue-50 rounded-lg border-2 border-blue-100 py-2 px-3 mb-4 inline-flex items-center self-center">
                      <span className="text-blue-700 text-sm font-bold whitespace-nowrap">제 {currentExecutive.generation}대</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-gray-900 text-xs font-semibold uppercase tracking-wider mb-1">회장</h3>
                          <p className="text-gray-800 text-sm font-bold">{currentExecutive.president}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-gray-900 text-xs font-semibold uppercase tracking-wider mb-1">총무</h3>
                          <p className="text-gray-800 text-sm font-bold">{currentExecutive.treasurer}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-gray-900 text-xs font-semibold uppercase tracking-wider mb-1">임기</h3>
                          <p className="text-gray-800 text-sm font-bold">{currentExecutive.term}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">임원단 정보가 없습니다</h3>
                    {canEdit && (
                      <p className="text-xs text-gray-500">
                        모임 정보 페이지에서 입력해주세요.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 모임 소개 카드 */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
              <div className="h-2 md:h-3 bg-gradient-to-r from-blue-500 to-blue-700"></div>
              <div className="p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 md:mb-8 mx-auto transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <div className="flex justify-between items-center mb-4 md:mb-5">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 text-center flex-grow">모임 소개</h3>
                  {canEdit && (
                    <button
                      onClick={() => setIsIntroModalOpen(true)}
                      className="bg-blue-100 text-blue-600 hover:bg-blue-200 font-medium p-1.5 rounded-lg transition-all duration-300 flex items-center text-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed text-center">
                  {introText}
                </p>
              </div>
            </div>
            
            {/* 활동 내용 카드 */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
              <div className="h-2 md:h-3 bg-gradient-to-r from-blue-500 to-blue-700"></div>
              <div className="p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 md:mb-8 mx-auto transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div className="flex justify-between items-center mb-4 md:mb-5">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 text-center flex-grow">활동 내용</h3>
                  {canEdit && (
                    <button
                      onClick={() => setIsActivityModalOpen(true)}
                      className="bg-blue-100 text-blue-600 hover:bg-blue-200 font-medium p-1.5 rounded-lg transition-all duration-300 flex items-center text-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed text-center">
                  {activityText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* 모임 소개 수정 모달 */}
      {isIntroModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-lg w-full animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-4 px-6 text-white">
              <h2 className="text-xl font-bold">모임 소개 수정</h2>
            </div>
            <div className="p-6">
              <textarea
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 mb-4 h-40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                placeholder="모임 소개를 입력하세요..."
              ></textarea>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsIntroModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleIntroUpdate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 활동 내용 수정 모달 */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-lg w-full animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-4 px-6 text-white">
              <h2 className="text-xl font-bold">활동 내용 수정</h2>
            </div>
            <div className="p-6">
              <textarea
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 mb-4 h-40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                placeholder="활동 내용을 입력하세요..."
              ></textarea>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleActivityUpdate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
