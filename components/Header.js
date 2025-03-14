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
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white text-gray-800 shadow-lg py-3' 
          : 'bg-transparent text-white py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          <span className="text-blue-600">W</span>esterners
        </Link>
        
        {/* 데스크톱 메뉴 */}
        <div className="hidden md:flex items-center space-x-8">
          {/* 홈 메뉴 */}
          <Link 
            href="/" 
            className={`font-medium hover:text-blue-600 transition-colors ${
              isActive('/') ? 'text-blue-600' : ''
            }`}
          >
            홈
          </Link>
          
          {/* 회칙 메뉴 - 로그인한 사용자만 */}
          {currentUser && (
            <Link 
              href="/rules" 
              className={`font-medium hover:text-blue-600 transition-colors ${
                isActive('/rules') ? 'text-blue-600' : ''
              }`}
            >
              회칙
            </Link>
          )}
          
          {/* 갤러리 메뉴 - 로그인한 사용자만 */}
          {currentUser && (
            <Link 
              href="/gallery" 
              className={`font-medium hover:text-blue-600 transition-colors ${
                isActive('/gallery') ? 'text-blue-600' : ''
              }`}
            >
              갤러리
            </Link>
          )}
          
          {/* 회비 관리 메뉴 - 총무/관리자만 */}
          {currentUser && userProfile && (userProfile.role === 'treasurer' || userProfile.role === 'admin') && (
            <Link 
              href="/fees" 
              className={`font-medium hover:text-blue-600 transition-colors ${
                isActive('/fees') ? 'text-blue-600' : ''
              }`}
            >
              회비 관리
            </Link>
          )}
          
          {/* 회원 관리 메뉴 - 관리자만 */}
          {currentUser && userProfile && userProfile.role === 'admin' && (
            <Link 
              href="/admin/members" 
              className={`font-medium hover:text-blue-600 transition-colors ${
                isActive('/admin/members') ? 'text-blue-600' : ''
              }`}
            >
              회원 관리
            </Link>
          )}
          
          {/* 로그인/로그아웃 및 비밀번호 변경 */}
          {currentUser ? (
            <div className="flex items-center space-x-4">
              {/* 비밀번호 변경 아이콘 */}
              <Link 
                href="/change-password" 
                className="text-current hover:text-blue-600 transition-colors"
                title="비밀번호 변경"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </Link>
              {/* 로그아웃 버튼 */}
              <button 
                onClick={handleLogout}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
        
        {/* 모바일 메뉴 버튼 */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-current focus:outline-none"
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
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          {/* 홈 메뉴 */}
          <Link 
            href="/" 
            className={`block py-2 font-medium hover:text-blue-600 transition-colors ${
              isActive('/') ? 'text-blue-600' : 'text-gray-800'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            홈
          </Link>
          
          {/* 회칙 메뉴 - 로그인한 사용자만 */}
          {currentUser && (
            <Link 
              href="/rules" 
              className={`block py-2 font-medium hover:text-blue-600 transition-colors ${
                isActive('/rules') ? 'text-blue-600' : 'text-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              회칙
            </Link>
          )}
          
          {/* 갤러리 메뉴 - 로그인한 사용자만 */}
          {currentUser && (
            <Link 
              href="/gallery" 
              className={`block py-2 font-medium hover:text-blue-600 transition-colors ${
                isActive('/gallery') ? 'text-blue-600' : 'text-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              갤러리
            </Link>
          )}
          
          {/* 회비 관리 메뉴 - 총무/관리자만 */}
          {currentUser && userProfile && (userProfile.role === 'treasurer' || userProfile.role === 'admin') && (
            <Link 
              href="/fees" 
              className={`block py-2 font-medium hover:text-blue-600 transition-colors ${
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
              className={`block py-2 font-medium hover:text-blue-600 transition-colors ${
                isActive('/admin/members') ? 'text-blue-600' : 'text-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              회원 관리
            </Link>
          )}
          
          {/* 로그인/로그아웃 및 비밀번호 변경 */}
          {currentUser ? (
            <div className="py-2 flex flex-col space-y-2">
              <Link 
                href="/change-password" 
                className="flex items-center text-gray-800 hover:text-blue-600 transition-colors"
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="block py-2 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-md transition-colors mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 