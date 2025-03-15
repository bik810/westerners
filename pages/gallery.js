import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import { db, storage } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref } from 'firebase/storage';
import { useAuth } from '../lib/authContext';
import { auth } from '../lib/firebase';
import { compressImage } from '../lib/utils/imageCompressor';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { userProfile } = useAuth();
  
  // 권한 확인 함수
  const canEdit = userProfile && (userProfile.role === 'admin' || userProfile.role === 'treasurer');
  
  // 업로드 폼 상태
  const [uploadForm, setUploadForm] = useState({
    title: '',
    date: '',
    description: '',
    file: null
  });

  // 사진 데이터 불러오기
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setIsLoading(true);
        const photosQuery = query(collection(db, 'gallery'), orderBy('date', 'desc'));
        const photosSnapshot = await getDocs(photosQuery);
        
        const photosData = photosSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Base64 이미지 데이터가 있으면 그것을 사용, 없으면 기존 imageUrl 사용
            imageUrl: data.imageData || data.imageUrl
          };
        });
        
        setPhotos(photosData);
        setError(null);
      } catch (err) {
        console.error('사진 데이터 로드 중 오류 발생:', err);
        setError('사진 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPhotos();
  }, []);

  // 사진 업로드 처리
  const handleUpload = async (e) => {
    e.preventDefault();
    console.log('업로드 폼 제출됨');
    
    try {
      // 입력 검증
      if (!selectedPhoto && !uploadForm.file) {
        console.log('파일이 선택되지 않음');
        alert('파일을 선택해주세요.');
        return;
      }
      
      if (!uploadForm.title.trim()) {
        console.log('제목이 입력되지 않음');
        alert('제목을 입력해주세요.');
        return;
      }
      
      if (!uploadForm.date.trim()) {
        console.log('날짜가 입력되지 않음');
        alert('날짜를 입력해주세요.');
        return;
      }
      
      // 날짜 형식 검증 (YYYY/MM/DD)
      const datePattern = /^\d{4}\/\d{2}\/\d{2}$/;
      if (!datePattern.test(uploadForm.date)) {
        console.log('날짜 형식이 올바르지 않음:', uploadForm.date);
        alert('날짜는 YYYY/MM/DD 형식으로 입력해주세요. (예: 2023/12/25)');
        return;
      }
      
      // 파일 크기 검증 (15MB 제한 - 압축할 것이므로 제한 완화)
      if (uploadForm.file) {
        const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
        if (uploadForm.file.size > MAX_FILE_SIZE) {
          console.log('파일 크기 초과:', uploadForm.file.size);
          alert('파일 크기는 15MB 이하여야 합니다.');
          return;
        }
        
        // 파일 형식 검증
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(uploadForm.file.type)) {
          console.log('지원되지 않는 파일 형식:', uploadForm.file.type);
          alert('지원되는 이미지 형식은 JPEG, PNG, GIF, WEBP입니다.');
          return;
        }
      }
      
      console.log('업로드 시작', uploadForm);
      setUploadProgress(0);
      
      // 현재 인증 상태 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('사용자가 인증되지 않았습니다.');
        alert('로그인이 필요합니다. 다시 로그인 후 시도해주세요.');
        return;
      }
      
      // 인증 토큰 갱신
      const token = await currentUser.getIdToken(true);
      console.log('인증 토큰 갱신됨, 업로드 계속 진행');
      
      try {
        let compressedImage = null;
        
        // 새 파일이 선택된 경우에만 이미지 압축 진행
        if (uploadForm.file) {
          // 이미지 압축 및 리사이징
          compressedImage = await compressImage(
            uploadForm.file, 
            {
              maxWidth: 1200,
              maxHeight: 1200,
              quality: 0.7,
              maxSize: 900000 // 900KB (Firestore 제한 1MB보다 작게)
            },
            (progress) => {
              // 압축 진행 상황 업데이트 (0-50%)
              setUploadProgress(progress);
            }
          );
          
          console.log('이미지 압축 완료, 크기:', compressedImage.length);
        } else if (selectedPhoto) {
          // 수정 모드이고 새 파일이 없는 경우 기존 이미지 데이터 사용
          compressedImage = selectedPhoto.imageUrl;
          setUploadProgress(50); // 압축 과정 건너뛰기
        }
        
        // 파일 이름 생성
        const fileExtension = 'jpg'; // 압축 후에는 항상 JPEG 형식
        const fileName = `gallery_${Date.now()}.${fileExtension}`;
        
        // Firestore에 사진 정보 저장
        const photoData = {
          title: uploadForm.title,
          date: uploadForm.date,
          description: uploadForm.description || '',
          imageData: compressedImage, // 압축된 Base64 이미지 데이터
          contentType: 'image/jpeg',
          fileName: fileName,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.uid
        };
        
        console.log('Firestore에 저장 시작');
        setUploadProgress(70);
        
        if (selectedPhoto) {
          // 기존 문서 업데이트
          await setDoc(doc(db, 'gallery', selectedPhoto.id), photoData, { merge: true });
          console.log('Firestore 문서 업데이트 완료, 문서 ID:', selectedPhoto.id);
          
          // 상태 업데이트
          setPhotos(prevPhotos => prevPhotos.map(p => 
            p.id === selectedPhoto.id 
              ? { id: selectedPhoto.id, ...photoData, imageUrl: compressedImage }
              : p
          ));
        } else {
          // 새 문서 추가
          const docRef = await addDoc(collection(db, 'gallery'), photoData);
          console.log('Firestore에 저장 완료, 문서 ID:', docRef.id);
          
          // 상태 업데이트
          setPhotos(prevPhotos => [
            {
              id: docRef.id,
              ...photoData,
              imageUrl: compressedImage // 이미지 URL 대신 압축된 Base64 데이터 사용
            },
            ...prevPhotos
          ]);
        }
        
        setUploadProgress(100);
        
        // 폼 초기화
        setUploadForm({
          title: '',
          date: '',
          description: '',
          file: null
        });
        
        // 선택된 사진 초기화
        setSelectedPhoto(null);
        
        // 모달 닫기
        setIsUploadModalOpen(false);
        setUploadProgress(0);
        alert(selectedPhoto ? '사진이 성공적으로 수정되었습니다.' : '사진이 성공적으로 업로드되었습니다.');
      } catch (err) {
        console.error('이미지 처리 중 오류:', err);
        console.error('오류 세부 정보:', err.stack);
        alert(`이미지 처리 중 오류가 발생했습니다: ${err.message}`);
        setUploadProgress(0);
      }
    } catch (err) {
      console.error('업로드 처리 중 오류:', err);
      console.error('오류 세부 정보:', err.stack);
      alert(`업로드 처리 중 오류가 발생했습니다: ${err.message}`);
      setUploadProgress(0);
    }
  };

  // 파일 선택 처리
  const handleFileChange = (e) => {
    console.log('파일 선택 이벤트 발생', e.target.files);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log('선택된 파일:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      // 파일 크기 검증 (15MB 제한)
      const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
      if (selectedFile.size > MAX_FILE_SIZE) {
        alert('파일 크기는 15MB 이하여야 합니다.');
        e.target.value = ''; // 파일 선택 초기화
        return;
      }
      
      // 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('지원되는 이미지 형식은 JPEG, PNG, GIF, WEBP입니다.');
        e.target.value = ''; // 파일 선택 초기화
        return;
      }
      
      // 현재 날짜로 날짜 필드 자동 설정 (아직 설정되지 않은 경우)
      if (!uploadForm.date) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        setUploadForm(prev => ({
          ...prev,
          date: `${year}/${month}/${day}`,
          file: selectedFile
        }));
      } else {
        setUploadForm(prev => ({
          ...prev,
          file: selectedFile
        }));
      }
    }
  };

  // 폼 입력 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 날짜 형식 검증 (YYYY/MM/DD)
    if (name === 'date') {
      // 이전 값 가져오기
      const prevValue = uploadForm.date;
      
      // 백스페이스로 지우는 경우 특별 처리
      if (prevValue.length > value.length) {
        // 마지막 문자가 슬래시인 경우 슬래시와 그 앞 숫자까지 함께 지움
        if (prevValue.endsWith('/') && !value.endsWith('/')) {
          const newValue = value.slice(0, -1);
          setUploadForm(prev => ({
            ...prev,
            [name]: newValue
          }));
          return;
        }
      }
      
      // 숫자와 / 문자만 허용
      const sanitizedValue = value.replace(/[^\d/]/g, '');
      
      // 자동으로 / 추가
      let formattedValue = '';
      
      // 숫자만 추출
      const digitsOnly = sanitizedValue.replace(/\//g, '');
      
      // 숫자를 YYYY/MM/DD 형식으로 변환 (최대 8자리)
      const limitedDigits = digitsOnly.slice(0, 8);
      
      if (limitedDigits.length > 0) {
        // 년도 부분 (4자리)
        formattedValue = limitedDigits.slice(0, Math.min(4, limitedDigits.length));
        
        // 월 부분 (2자리)
        if (limitedDigits.length > 4) {
          let month = limitedDigits.slice(4, Math.min(6, limitedDigits.length));
          // 월이 12를 넘지 않도록 제한
          if (parseInt(month) > 12) {
            month = '12';
          } else if (parseInt(month) === 0 && month.length === 2) {
            month = '01';
          }
          
          formattedValue += '/' + month;
          
          // 월이 2자리가 되면 자동으로 슬래시 추가
          if (limitedDigits.length === 6 && !sanitizedValue.endsWith('/') && 
              (prevValue.length < value.length || !prevValue.includes('/'))) {
            formattedValue += '/';
          }
          
          // 일 부분 (2자리)
          if (limitedDigits.length > 6) {
            let day = limitedDigits.slice(6, 8);
            // 일이 31을 넘지 않도록 제한
            if (parseInt(day) > 31) {
              day = '31';
            } else if (parseInt(day) === 0 && day.length === 2) {
              day = '01';
            }
            formattedValue += (formattedValue.endsWith('/') ? '' : '/') + day;
          }
        } else if (limitedDigits.length === 4 && !sanitizedValue.endsWith('/')) {
          // 년도 4자리 입력 후 자동으로 슬래시 추가
          formattedValue += '/';
        }
      }
      
      setUploadForm(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }
    
    setUploadForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 사진 보기
  const handleViewPhoto = (photo) => {
    setSelectedPhoto(photo);
    setIsViewModalOpen(true);
  };

  // 사진 수정 모달 열기
  const handleEditPhoto = (photo) => {
    setIsViewModalOpen(false);
    setSelectedPhoto(photo);
    
    // 업로드 폼에 선택된 사진 정보 설정
    setUploadForm({
      title: photo.title,
      date: photo.date,
      description: photo.description || '',
      file: null // 파일은 변경하지 않음
    });
    
    // 약간의 지연 후 업로드 모달 열기 (애니메이션 충돌 방지)
    setTimeout(() => {
      setIsUploadModalOpen(true);
    }, 100);
  };

  // 사진 삭제
  const handleDeletePhoto = async (photo) => {
    if (!confirm('정말로 이 사진을 삭제하시겠습니까?')) return;
    
    try {
      // Firestore에서 문서 삭제
      await deleteDoc(doc(db, 'gallery', photo.id));
      console.log('Firestore에서 문서 삭제 완료');
      
      // 상태 업데이트
      setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photo.id));
      
      if (isViewModalOpen && selectedPhoto?.id === photo.id) {
        setIsViewModalOpen(false);
      }
      
      alert('사진이 성공적으로 삭제되었습니다.');
    } catch (err) {
      console.error('사진 삭제 중 오류:', err);
      alert(`사진 삭제 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 사진 다운로드 처리
  const handleDownloadPhoto = (photo) => {
    try {
      // 이미지 데이터 가져오기
      const imageData = photo.imageUrl;
      
      // 다운로드 링크 생성
      const link = document.createElement('a');
      link.href = imageData;
      
      // 파일명 설정 (날짜_제목.jpg 형식)
      const fileName = `${photo.date.replace(/\//g, '-')}_${photo.title}.jpg`;
      link.download = fileName;
      
      // 링크 클릭 이벤트 발생시켜 다운로드 시작
      document.body.appendChild(link);
      link.click();
      
      // 링크 제거
      document.body.removeChild(link);
      
      console.log('이미지 다운로드 완료:', fileName);
    } catch (err) {
      console.error('이미지 다운로드 중 오류:', err);
      alert('이미지 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    try {
      // YYYY/MM/DD 형식 처리
      if (dateString.includes('/')) {
        const [year, month, day] = dateString.split('/');
        const date = new Date(year, month - 1, day);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('ko-KR', options);
      }
      
      // 기존 형식 처리
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('ko-KR', options);
    } catch (error) {
      // 오류 발생 시 원본 문자열 반환
      return dateString;
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Head>
          <title>Westerners - 갤러리</title>
          <meta name="description" content="Westerners 모임 갤러리" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Header />

        {/* Hero Section */}
        <section className="pt-32 pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">정기 모임 갤러리</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              서쪽모임의 소중한 추억을 함께 공유합니다
            </p>
            {canEdit && (
              <div className="mt-8">
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-white text-blue-800 hover:bg-blue-100 font-semibold py-2 px-6 rounded-full transition-all duration-300 flex items-center mx-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  사진 업로드
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Gallery Content */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p className="text-xl font-medium">아직 업로드된 사진이 없습니다</p>
                <p className="mt-2">첫 번째 사진을 업로드해 보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photos.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    onClick={() => handleViewPhoto(photo)}
                  >
                    <div className="relative h-48">
                      <Image 
                        src={photo.imageUrl} 
                        alt={photo.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-800 truncate">{photo.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(photo.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 사진 보기 모달 */}
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={selectedPhoto?.title || '사진 보기'}>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative h-96 w-full">
                <Image 
                  src={selectedPhoto.imageUrl} 
                  alt={selectedPhoto.title}
                  layout="fill"
                  objectFit="contain"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">{selectedPhoto.title}</h3>
                <p className="text-sm md:text-base text-gray-500">{formatDate(selectedPhoto.date)}</p>
                <p className="mt-2 text-sm md:text-base text-gray-700 leading-relaxed">{selectedPhoto.description}</p>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleDownloadPhoto(selectedPhoto)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  다운로드
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => handleEditPhoto(selectedPhoto)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      수정
                    </button>
                    <button
                      onClick={() => {
                        handleDeletePhoto(selectedPhoto);
                        setIsViewModalOpen(false);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      삭제
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* 사진 업로드 모달 */}
        {isUploadModalOpen && (
          <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)}>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {selectedPhoto ? '사진 수정' : '사진 업로드'}
              </h2>
              
              <form onSubmit={(e) => {
                console.log('폼 제출 이벤트 발생');
                handleUpload(e);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    name="title"
                    value={uploadForm.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="사진 제목을 입력하세요"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="date"
                      value={uploadForm.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="YYYY/MM/DD 형식으로 입력하세요"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(2, '0');
                        const day = String(today.getDate()).padStart(2, '0');
                        setUploadForm(prev => ({
                          ...prev,
                          date: `${year}/${month}/${day}`
                        }));
                      }}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors whitespace-nowrap"
                    >
                      오늘 날짜
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">예: 2023/12/25</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    name="description"
                    value={uploadForm.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="사진에 대한 설명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedPhoto ? '새 사진 파일 (선택사항)' : '사진 파일'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      console.log('파일 선택 이벤트 발생', e.target.files);
                      handleFileChange(e);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!selectedPhoto} // 수정 시에는 파일 선택이 필수가 아님
                  />
                  {uploadForm.file && (
                    <p className="mt-1 text-sm text-gray-500">
                      선택된 파일: {uploadForm.file.name}
                    </p>
                  )}
                  {selectedPhoto && !uploadForm.file && (
                    <p className="mt-1 text-sm text-gray-500">
                      파일을 선택하지 않으면 기존 이미지가 유지됩니다.
                    </p>
                  )}
                </div>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 text-center">{Math.round(uploadProgress)}% 업로드 중...</p>
                  </div>
                )}
                
                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setSelectedPhoto(null);
                      setUploadForm({
                        title: '',
                        date: '',
                        description: '',
                        file: null
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    disabled={uploadProgress > 0 && uploadProgress < 100}
                  >
                    {selectedPhoto ? '수정' : '업로드'}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
} 