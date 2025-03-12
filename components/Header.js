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
        
        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            <li>
              <Link 
                href="/" 
                className={`transition-all duration-300 hover:text-blue-600 ${
                  isActive('/') 
                    ? 'font-semibold text-blue-600' 
                    : 'font-medium'
                }`}
              >
                홈
              </Link>
            </li>
            <li>
              <Link 
                href="/rules" 
                className={`transition-all duration-300 hover:text-blue-600 ${
                  isActive('/rules') 
                    ? 'font-semibold text-blue-600' 
                    : 'font-medium'
                }`}
              >
                회칙
              </Link>
            </li>
            <li>
              <Link 
                href="/fees" 
                className={`transition-all duration-300 hover:text-blue-600 ${
                  isActive('/fees') 
                    ? 'font-semibold text-blue-600' 
                    : 'font-medium'
                }`}
              >
                회비 관리
              </Link>
            </li>
            <li>
              <Link 
                href="/gallery" 
                className={`transition-all duration-300 hover:text-blue-600 ${
                  isActive('/gallery') 
                    ? 'font-semibold text-blue-600' 
                    : 'font-medium'
                }`}
              >
                갤러리
              </Link>
            </li>
            {hasPermission && hasPermission('admin') && (
              <li>
                <Link 
                  href="/admin/members" 
                  className={`transition-all duration-300 hover:text-blue-600 ${
                    isActive('/admin/members') 
                      ? 'font-semibold text-blue-600' 
                      : 'font-medium'
                  }`}
                >
                  회원 관리
                </Link>
              </li>
            )}
            {currentUser ? (
              <li>
                <button
                  onClick={handleLogout}
                  className="transition-all duration-300 hover:text-blue-600 font-medium"
                >
                  로그아웃
                </button>
              </li>
            ) : (
              <li>
                <Link 
                  href="/login" 
                  className={`transition-all duration-300 hover:text-blue-600 ${
                    isActive('/login') 
                      ? 'font-semibold text-blue-600' 
                      : 'font-medium'
                  }`}
                >
                  로그인
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-2xl focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={`md:hidden absolute w-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <nav className="container mx-auto px-6 py-4">
          <ul className="space-y-4">
            <li>
              <Link 
                href="/" 
                className={`block py-2 text-gray-800 hover:text-blue-600 ${
                  isActive('/') ? 'font-semibold text-blue-600' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                홈
              </Link>
            </li>
            <li>
              <Link 
                href="/rules" 
                className={`block py-2 text-gray-800 hover:text-blue-600 ${
                  isActive('/rules') ? 'font-semibold text-blue-600' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                회칙
              </Link>
            </li>
            <li>
              <Link 
                href="/fees" 
                className={`block py-2 text-gray-800 hover:text-blue-600 ${
                  isActive('/fees') ? 'font-semibold text-blue-600' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                회비 관리
              </Link>
            </li>
            <li>
              <Link 
                href="/gallery" 
                className={`block py-2 text-gray-800 hover:text-blue-600 ${
                  isActive('/gallery') ? 'font-semibold text-blue-600' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                갤러리
              </Link>
            </li>
            {hasPermission && hasPermission('admin') && (
              <li>
                <Link 
                  href="/admin/members" 
                  className={`block py-2 text-gray-800 hover:text-blue-600 ${
                    isActive('/admin/members') ? 'font-semibold text-blue-600' : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  회원 관리
                </Link>
              </li>
            )}
            {currentUser ? (
              <li>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block py-2 text-gray-800 hover:text-blue-600"
                >
                  로그아웃
                </button>
              </li>
            ) : (
              <li>
                <Link 
                  href="/login" 
                  className={`block py-2 text-gray-800 hover:text-blue-600 ${
                    isActive('/login') ? 'font-semibold text-blue-600' : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  로그인
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
} 