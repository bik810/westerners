import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import { db, storage } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../lib/authContext';
import { auth } from '../lib/firebase';

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
        
        const photosData = photosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
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

  // Firebase Storage 초기화 확인
  useEffect(() => {
    try {
      console.log('Firebase Storage 초기화 확인');
      console.log('Storage 객체:', storage);
      console.log('Storage 버킷:', storage.app.options.storageBucket);
      
      // 테스트 참조 생성
      const testRef = ref(storage, 'test');
      console.log('테스트 참조 생성 성공:', testRef);
    } catch (err) {
      console.error('Firebase Storage 초기화 확인 중 오류:', err);
    }
  }, []);

  // 사진 업로드 처리
  const handleUpload = async (e) => {
    e.preventDefault();
    console.log('업로드 폼 제출됨');
    
    try {
      // 입력 검증
      if (!uploadForm.file) {
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
      
      // 파일 크기 검증 (10MB 제한)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (uploadForm.file.size > MAX_FILE_SIZE) {
        console.log('파일 크기 초과:', uploadForm.file.size);
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      
      // 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(uploadForm.file.type)) {
        console.log('지원되지 않는 파일 형식:', uploadForm.file.type);
        alert('지원되는 이미지 형식은 JPEG, PNG, GIF, WEBP입니다.');
        return;
      }
      
      console.log('업로드 시작', uploadForm);
      setUploadProgress(0);
      
      // 파일 이름 생성
      const fileExtension = uploadForm.file.name.split('.').pop();
      const fileName = `gallery_${Date.now()}.${fileExtension}`;
      console.log('생성된 파일명:', fileName);
      
      try {
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
        
        // Firebase Storage에 이미지 업로드
        console.log('Firebase Storage 참조 생성 시작');
        
        // 명시적으로 전체 버킷 경로 지정
        const bucketUrl = storage.app.options.storageBucket;
        console.log('사용 중인 Storage 버킷:', bucketUrl);
        
        // 명시적으로 전체 경로 지정 (CORS 문제 해결을 위해)
        const storageRef = ref(storage, `gallery/${fileName}`);
        console.log('Storage 참조 생성됨:', storageRef);
        console.log('Storage 참조 전체 경로:', storageRef.toString());
        
        console.log('uploadBytesResumable 호출 시작');
        // 메타데이터 추가
        const metadata = {
          contentType: uploadForm.file.type,
          customMetadata: {
            'uploadedBy': currentUser.uid,
            'uploadedAt': new Date().toISOString(),
            'authToken': 'Bearer ' + token.substring(0, 10) + '...' // 토큰 일부만 로깅 (보안)
          }
        };
        
        // 업로드 전 토큰 확인
        if (localStorage.getItem('firebaseAuthToken')) {
          console.log('localStorage에 토큰 존재, 길이:', localStorage.getItem('firebaseAuthToken').length);
        } else {
          console.warn('localStorage에 토큰이 없음, 새로 발급 시도');
          await currentUser.getIdToken(true);
        }
        
        // CORS 문제 해결을 위한 추가 설정
        console.log('CORS 설정 확인 - 현재 도메인:', window.location.origin);
        console.log('CORS 설정 확인 - 버킷 URL:', `https://${bucketUrl}`);
        
        try {
          const uploadTask = uploadBytesResumable(storageRef, uploadForm.file, metadata);
          console.log('uploadTask 생성됨:', uploadTask);
          
          // 업로드 진행 상태 모니터링
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 80;
              console.log('업로드 진행률:', progress);
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Storage 업로드 중 오류:', error);
              console.error('오류 코드:', error.code);
              console.error('오류 메시지:', error.message);
              console.error('오류 세부 정보:', error.serverResponse);
              
              // 오류 유형에 따른 처리
              let errorMessage = '이미지 업로드 중 오류가 발생했습니다.';
              
              if (error.code === 'storage/unauthorized') {
                errorMessage = '권한이 없습니다. 로그인 상태를 확인하고 다시 시도해주세요.';
                // 토큰 갱신 시도
                auth.currentUser?.getIdToken(true)
                  .then(() => console.log('토큰 갱신 시도'))
                  .catch(e => console.error('토큰 갱신 실패:', e));
              } else if (error.code === 'storage/canceled') {
                errorMessage = '업로드가 취소되었습니다.';
              } else if (error.code === 'storage/retry-limit-exceeded') {
                errorMessage = '네트워크 상태가 불안정합니다. 다시 시도해주세요.';
              } else if (error.code === 'storage/invalid-checksum') {
                errorMessage = '파일이 손상되었습니다. 다른 파일을 선택해주세요.';
              } else if (error.code === 'storage/server-file-wrong-size') {
                errorMessage = '파일 크기 오류가 발생했습니다. 다시 시도해주세요.';
              }
              
              // CORS 관련 오류 확인
              if (error.message && error.message.includes('CORS')) {
                errorMessage = 'CORS 오류: 서버 설정 문제가 있습니다. 관리자에게 문의하세요.';
                console.error('CORS 오류 감지됨. 현재 도메인:', window.location.origin);
              }
              
              alert(errorMessage);
              setUploadProgress(0);
            },
            async () => {
              // 업로드 완료 후 다운로드 URL 가져오기
              try {
                console.log('업로드 완료, URL 가져오기 시작');
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('이미지 URL:', downloadURL);
                setUploadProgress(90);
                
                // Firestore에 사진 정보 저장
                const photoData = {
                  title: uploadForm.title,
                  date: uploadForm.date,
                  description: uploadForm.description || '',
                  imageUrl: downloadURL, // Storage에서 가져온 URL
                  fileName: fileName,
                  uploadedAt: new Date().toISOString(),
                  uploadedBy: currentUser.uid
                };
                
                console.log('Firestore에 저장 시작', photoData);
                
                // Firestore에 문서 추가
                const docRef = await addDoc(collection(db, 'gallery'), photoData);
                console.log('Firestore에 저장 완료, 문서 ID:', docRef.id);
                setUploadProgress(100);
                
                // 상태 업데이트
                setPhotos(prevPhotos => [
                  {
                    id: docRef.id,
                    ...photoData
                  },
                  ...prevPhotos
                ]);
                
                // 폼 초기화
                setUploadForm({
                  title: '',
                  date: '',
                  description: '',
                  file: null
                });
                
                // 모달 닫기
                setIsUploadModalOpen(false);
                setUploadProgress(0);
                alert('사진이 성공적으로 업로드되었습니다.');
              } catch (err) {
                console.error('Firestore 저장 중 오류:', err);
                console.error('오류 세부 정보:', err.stack);
                alert(`사진 정보 저장 중 오류가 발생했습니다: ${err.message}`);
                setUploadProgress(0);
              }
            }
          );
        } catch (err) {
          console.error('업로드 처리 중 오류:', err);
          console.error('오류 세부 정보:', err.stack);
          alert(`업로드 처리 중 오류가 발생했습니다: ${err.message}`);
          setUploadProgress(0);
        }
      } catch (err) {
        console.error('업로드 처리 중 오류:', err);
        console.error('오류 세부 정보:', err.stack);
        alert(`업로드 처리 중 오류가 발생했습니다: ${err.message}`);
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
      
      // 파일 크기 검증 (10MB 제한)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > MAX_FILE_SIZE) {
        alert('파일 크기는 10MB 이하여야 합니다.');
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

  // 사진 삭제
  const handleDeletePhoto = async (photo) => {
    if (!confirm('정말로 이 사진을 삭제하시겠습니까?')) return;
    
    try {
      // 1. Firebase Storage에서 이미지 파일 삭제
      if (photo.fileName) {
        try {
          const storageRef = ref(storage, `gallery/${photo.fileName}`);
          await deleteObject(storageRef);
          console.log('Storage에서 이미지 삭제 완료');
        } catch (storageErr) {
          console.error('Storage 이미지 삭제 중 오류:', storageErr);
          // Storage 오류가 있어도 Firestore 문서는 삭제 진행
        }
      } else if (photo.imageUrl && photo.imageUrl.includes('firebase')) {
        // 파일명이 없지만 Firebase URL이 있는 경우
        try {
          const urlRef = ref(storage, photo.imageUrl);
          await deleteObject(urlRef);
          console.log('Storage에서 URL로 이미지 삭제 완료');
        } catch (urlErr) {
          console.error('Storage URL 삭제 중 오류:', urlErr);
          // 계속 진행
        }
      }
      
      // 2. Firestore에서 문서 삭제
      await deleteDoc(doc(db, 'gallery', photo.id));
      console.log('Firestore에서 문서 삭제 완료');
      
      // 3. 상태 업데이트
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

        {/* 사진 업로드 모달 */}
        {isUploadModalOpen && (
          <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)}>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">사진 업로드</h2>
              
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
                  <input
                    type="text"
                    name="date"
                    value={uploadForm.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="YYYY/MM/DD 형식으로 입력하세요"
                    required
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">사진 파일</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      console.log('파일 선택 이벤트 발생', e.target.files);
                      handleFileChange(e);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {uploadForm.file && (
                    <p className="mt-1 text-sm text-gray-500">
                      선택된 파일: {uploadForm.file.name}
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
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    disabled={uploadProgress > 0 && uploadProgress < 100}
                  >
                    업로드
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

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
                <h3 className="text-lg font-semibold">{selectedPhoto.title}</h3>
                <p className="text-sm text-gray-500">{selectedPhoto.date}</p>
                <p className="mt-2">{selectedPhoto.description}</p>
              </div>
              {canEdit && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      handleDeletePhoto(selectedPhoto);
                      setIsViewModalOpen(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        <Footer />
      </div>
    </ProtectedRoute>
  );
} 