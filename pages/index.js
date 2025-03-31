import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../lib/authContext';
import { getNextMeeting, getCurrentExecutive } from '../lib/firestoreService';
import MeetingEditModal from '../components/MeetingEditModal';

export default function Home() {
  const { currentUser, userProfile } = useAuth();
  const [nextMeeting, setNextMeeting] = useState(null);
  const [currentExecutive, setCurrentExecutive] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // 권한 확인 함수
  const canEdit = userProfile && (userProfile.role === 'admin' || userProfile.role === 'treasurer');
  
  // 정기모임 정보와 임원단 정보 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('데이터 로딩 시작...');
        
        const [meetingData, executiveData] = await Promise.all([
          getNextMeeting(),
          getCurrentExecutive()
        ]);
        
        console.log('정기모임 데이터:', meetingData);
        console.log('임원단 데이터:', executiveData);
        
        setNextMeeting(meetingData);
        setCurrentExecutive(executiveData);
      } catch (err) {
        console.error('데이터 로드 중 오류:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 정기모임 정보 업데이트 처리
  const handleMeetingUpdate = (updatedMeeting) => {
    console.log('정기모임 정보 업데이트:', updatedMeeting);
    setNextMeeting(updatedMeeting);
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
            
            <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
              <div className="h-2 md:h-3 bg-gradient-to-r from-blue-500 to-blue-700"></div>
              <div className="p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 md:mb-8 mx-auto transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-5 text-center">모임 소개</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed text-center">
                  Westerners는 싱가포르에서 근무하는 한국인들의 친목 모임입니다. 회원들 각자 처한 상황에서의 외로움과 어려움을 함께 나누고 서로에게 힘이 되어주는 따뜻한 모임입니다.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
              <div className="h-2 md:h-3 bg-gradient-to-r from-blue-500 to-blue-700"></div>
              <div className="p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 md:mb-8 mx-auto transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-5 text-center">활동 내용</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed text-center">
                  정기적인 모임을 통해 서로의 일상을 나누고 친목을 다집니다.
                  싱가포르 생활 정보 공유, 함께하는 식사 모임, 특별 행사 등 다양한 활동으로 
                  타국에서도 가족 같은 따뜻함을 느낄 수 있는 시간을 만들어갑니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* 정기모임 정보 수정 모달 */}
      <MeetingEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentMeeting={nextMeeting}
        onUpdate={handleMeetingUpdate}
      />
      
      {/* 다음 정기모임 팝업 */}
      {currentUser && nextMeeting && (nextMeeting.date || nextMeeting.time || nextMeeting.location) && (
        <div className="fixed bottom-6 right-6 max-w-sm w-full bg-white rounded-xl shadow-2xl overflow-hidden z-50 transform transition-all duration-300 animate-fade-in-up">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-3 px-4 text-white flex justify-between items-center">
            <h2 className="text-md font-bold flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              다음 정기모임 안내
            </h2>
            {canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium py-1 px-2 rounded-lg transition-all duration-300 flex items-center text-xs"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
                수정
              </button>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex flex-col">
              <div className="bg-blue-50 rounded-lg border-2 border-blue-100 py-1.5 px-3 mb-3 inline-flex items-center self-start">
                <span className="text-blue-700 text-sm font-bold whitespace-nowrap">제 {nextMeeting.meetingNumber}차</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-full mr-3 flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 text-xs font-semibold uppercase tracking-wider mb-1">날짜</h3>
                    <p className="text-gray-800 text-sm font-bold">{nextMeeting.date || '미정'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-full mr-3 flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 text-xs font-semibold uppercase tracking-wider mb-1">시간</h3>
                    <p className="text-gray-800 text-sm font-bold">{nextMeeting.time || '미정'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-full mr-3 flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 text-xs font-semibold uppercase tracking-wider mb-1">장소</h3>
                    <p className="text-gray-800 text-sm font-bold">{nextMeeting.location || '미정'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
