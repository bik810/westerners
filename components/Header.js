import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

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
          mobileMenuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
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
          </ul>
        </nav>
      </div>
    </header>
  );
} 