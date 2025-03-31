import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';
import { logoutUser } from '../lib/firestoreService';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { currentUser, userProfile, hasPermission } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => {
    return router.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-sm text-gray-800 shadow-lg py-3' 
          : 'bg-transparent text-white py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight group">
          <span className="inline-block text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">W</span>
          <span className="inline-block transition-all duration-300 group-hover:tracking-wider">esterners</span>
        </Link>
        
        {/* 데스크톱 메뉴 */}
        <div className="hidden md:flex items-center space-x-8">
          {/* 홈 메뉴 */}
          <Link 
            href="/" 
            className={`font-medium relative overflow-hidden group ${
              isActive('/') ? 'text-blue-600' : ''
            }`}
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-blue-600">홈</span>
            <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full ${isActive('/') ? 'w-full' : ''}`}></span>
          </Link>
          
          {/* 모임 정보 메뉴 - 로그인한 사용자만 */}
          {currentUser && (
            <Link 
              href="/group-info" 
              className={`font-medium relative overflow-hidden group ${
                isActive('/group-info') ? 'text-blue-600' : ''
              }`}
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-blue-600">모임 정보</span>
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full ${isActive('/group-info') ? 'w-full' : ''}`}></span>
            </Link>
          )}
          
          {/* 갤러리 메뉴 - 로그인한 사용자만 */}
          {currentUser && (
            <Link 
              href="/gallery" 
              className={`font-medium relative overflow-hidden group ${
                isActive('/gallery') ? 'text-blue-600' : ''
              }`}
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-blue-600">갤러리</span>
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full ${isActive('/gallery') ? 'w-full' : ''}`}></span>
            </Link>
          )}
          
          {/* 회비 관리 메뉴 - 모든 로그인 사용자에게 표시 */}
          {currentUser && (
            <Link 
              href="/fees" 
              className={`font-medium relative overflow-hidden group ${
                isActive('/fees') ? 'text-blue-600' : ''
              }`}
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-blue-600">회비 관리</span>
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full ${isActive('/fees') ? 'w-full' : ''}`}></span>
            </Link>
          )}
          
          {/* 회원 관리 메뉴 - 관리자만 */}
          {currentUser && userProfile && userProfile.role === 'admin' && (
            <Link 
              href="/admin/members" 
              className={`font-medium relative overflow-hidden group ${
                isActive('/admin/members') ? 'text-blue-600' : ''
              }`}
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-blue-600">계정 관리</span>
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full ${isActive('/admin/members') ? 'w-full' : ''}`}></span>
            </Link>
          )}
          
          {/* 로그인/로그아웃 및 비밀번호 변경 */}
          {currentUser ? (
            <div className="flex items-center space-x-4">
              {/* 비밀번호 변경 아이콘 */}
              <Link 
                href="/change-password" 
                className="text-current hover:text-blue-600 transition-colors duration-300 transform hover:scale-110"
                title="비밀번호 변경"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </Link>
              {/* 로그아웃 버튼 */}
              <button 
                onClick={handleLogout}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              로그인
            </Link>
          )}
        </div>
        
        {/* 모바일 메뉴 버튼 */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-current focus:outline-none transition-transform duration-300 hover:scale-110"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* 모바일 메뉴 */}
      <div 
        className={`md:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen 
            ? 'max-h-screen opacity-100 visible' 
            : 'max-h-0 opacity-0 invisible'
        }`}
      >
        <div className="px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
          {/* 홈 메뉴 */}
          <Link 
            href="/" 
            className={`block py-3 font-medium hover:text-blue-600 transition-all duration-300 transform hover:translate-x-2 ${
              isActive('/') ? 'text-blue-600' : 'text-gray-800'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            홈
          </Link>
          
          {/* 모임 정보 메뉴 - 로그인한 사용자만 */}
          {currentUser && (
            <Link 
              href="/group-info" 
              className={`block py-3 font-medium hover:text-blue-600 transition-all duration-300 transform hover:translate-x-2 ${
                isActive('/group-info') ? 'text-blue-600' : 'text-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              모임 정보
            </Link>
          )}
          
          {/* 갤러리 메뉴 - 로그인한 사용자만 */}
          {currentUser && (
            <Link 
              href="/gallery" 
              className={`block py-3 font-medium hover:text-blue-600 transition-all duration-300 transform hover:translate-x-2 ${
                isActive('/gallery') ? 'text-blue-600' : 'text-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              갤러리
            </Link>
          )}
          
          {/* 회비 관리 메뉴 - 모든 로그인 사용자에게 표시 */}
          {currentUser && (
            <Link 
              href="/fees" 
              className={`block py-3 font-medium hover:text-blue-600 transition-all duration-300 transform hover:translate-x-2 ${
                isActive('/fees') ? 'text-blue-600' : 'text-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              회비 관리
            </Link>
          )}
          
          {/* 회원 관리 메뉴 - 관리자만 */}
          {currentUser && userProfile && userProfile.role === 'admin' && (
            <Link 
              href="/admin/members" 
              className={`block py-3 font-medium hover:text-blue-600 transition-all duration-300 transform hover:translate-x-2 ${
                isActive('/admin/members') ? 'text-blue-600' : 'text-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              계정 관리
            </Link>
          )}
          
          {/* 로그인/로그아웃 및 비밀번호 변경 */}
          {currentUser ? (
            <div className="py-3 flex flex-col space-y-3">
              <Link 
                href="/change-password" 
                className="flex items-center text-gray-800 hover:text-blue-600 transition-all duration-300 transform hover:translate-x-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                비밀번호 변경
              </Link>
              <button 
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="py-3">
              <Link 
                href="/login" 
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-full text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                로그인
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 