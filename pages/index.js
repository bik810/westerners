import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../lib/authContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function Home() {
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, userProfile } = useAuth();

  // 최근 갤러리 사진 가져오기
  useEffect(() => {
    const fetchRecentPhotos = async () => {
      try {
        const photosQuery = query(
          collection(db, 'gallery'), 
          orderBy('date', 'desc'), 
          limit(4)
        );
        const photosSnapshot = await getDocs(photosQuery);
        
        const photosData = photosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentPhotos(photosData);
      } catch (err) {
        console.error('최근 사진 로드 중 오류 발생:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentPhotos();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Westerners - 홈</title>
        <meta name="description" content="Westerners 모임 웹사이트" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>
        </div>
        <div className="container mx-auto px-6 z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-blue-400">W</span>esterners에 오신 것을 환영합니다
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10">
            싱가포르에서 함께 고생하며 일하는 사람들이 모여 만든 커뮤니티입니다. 정기모임을 통해 돈독한 우정을 나누고 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {currentUser ? (
              // 로그인한 사용자에게 표시할 버튼
              <>
                <Link href="/rules" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                  회칙 보기
                </Link>
                <Link href="/gallery" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                  갤러리
                </Link>
                {userProfile && (userProfile.role === 'treasurer' || userProfile.role === 'admin') && (
                  <Link href="/fees" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                    회비 관리
                  </Link>
                )}
                {userProfile && userProfile.role === 'admin' && (
                  <Link href="/admin/members" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                    회원 관리
                  </Link>
                )}
              </>
            ) : (
              // 로그인하지 않은 사용자에게 표시할 버튼
              <Link href="/login" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                로그인
              </Link>
            )}
          </div>
        </div>
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <a href="#about" className="animate-bounce text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </a>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">모임 소개</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="h-3 bg-blue-600"></div>
              <div className="p-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">모임 소개</h3>
                <p className="text-gray-600 leading-relaxed">
                  Westerners는 싱가포르에서 근무하는 한국인들의 친목 모임입니다. 회원들 각자 처한 상황에서의 외로움과 어려움을 함께 나누고 서로에게 힘이 되어주는 따뜻한 모임입니다.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="h-3 bg-blue-600"></div>
              <div className="p-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">활동 내용</h3>
                <p className="text-gray-600 leading-relaxed">
                  정기적인 모임을 통해 서로의 일상을 나누고 친목을 다집니다.
                  싱가포르 생활 정보 공유, 함께하는 식사 모임, 특별 행사 등 다양한 활동으로 
                  타국에서도 가족 같은 따뜻함을 느낄 수 있는 시간을 만들어갑니다.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="h-3 bg-blue-600"></div>
              <div className="p-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">우리의 가치</h3>
                <p className="text-gray-600 leading-relaxed">
                  서로를 존중하고 배려하는 마음으로 진정한 우정을 나눕니다.
                  국적과 나이를 초월한 다양한 경험과 지혜를 공유하며,
                  싱가포르에서의 삶이 더욱 풍요롭고 의미 있게 만들어 갑니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 최근 갤러리 섹션 - 로그인한 사용자만 */}
      {currentUser && (
        <section className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">최근 갤러리</h2>
              <div className="w-24 h-1 bg-white mx-auto"></div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : recentPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentPhotos.map((photo) => (
                  <Link href="/gallery" key={photo.id} className="block">
                    <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                      <div className="relative h-48 w-full">
                        <Image 
                          src={photo.imageUrl} 
                          alt={photo.title} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4 bg-white text-gray-800">
                        <h3 className="font-bold text-lg mb-1 truncate">{photo.title}</h3>
                        <p className="text-sm text-gray-600">{photo.date}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-xl">아직 갤러리에 사진이 없습니다.</p>
            )}
            
            <div className="text-center mt-10">
              <Link href="/gallery" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg inline-block">
                갤러리 더 보기
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
