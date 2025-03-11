import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import { db, storage } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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

  // 사진 업로드 처리
  const handleUpload = async (e) => {
    e.preventDefault();
    console.log('업로드 버튼 클릭됨');
    
    if (!uploadForm.file) {
      alert('파일을 선택해주세요.');
      return;
    }
    
    if (!uploadForm.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!uploadForm.date.trim()) {
      alert('날짜를 입력해주세요.');
      return;
    }
    
    // 날짜 형식 검증 (YYYY/MM/DD)
    const datePattern = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!datePattern.test(uploadForm.date)) {
      alert('날짜는 YYYY/MM/DD 형식으로 입력해주세요. (예: 2023/12/25)');
      return;
    }
    
    try {
      console.log('업로드 시작', uploadForm);
      setUploadProgress(0);
      
      // Firebase Storage에 파일 업로드
      const fileExtension = uploadForm.file.name.split('.').pop();
      const fileName = `gallery_${Date.now()}.${fileExtension}`;
      
      // 스토리지 참조 생성
      console.log('스토리지 참조 생성 시작');
      const storageRef = ref(storage, `gallery/${fileName}`);
      console.log('스토리지 참조 생성 완료', storageRef);
      
      // 파일 업로드
      console.log('파일 업로드 시작');
      const uploadTask = uploadBytesResumable(storageRef, uploadForm.file);
      console.log('업로드 작업 생성 완료', uploadTask);
      
      // 업로드 진행 상태 모니터링
      uploadTask.on(
        'state_changed', 
        (snapshot) => {
          // 진행 상태 업데이트
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('업로드 진행률:', progress);
          setUploadProgress(progress);
        },
        (error) => {
          // 오류 처리
          console.error('업로드 중 오류 발생:', error);
          alert(`파일 업로드 중 오류가 발생했습니다: ${error.message}`);
        },
        async () => {
          // 업로드 완료 처리
          console.log('업로드 완료, URL 가져오기 시작');
          try {
            // 업로드 완료 후 다운로드 URL 가져오기
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('다운로드 URL 가져오기 완료:', downloadURL);
            
            // Firestore에 사진 정보 저장
            const photoData = {
              title: uploadForm.title,
              date: uploadForm.date,
              description: uploadForm.description,
              imageUrl: downloadURL,
              fileName: fileName,
              uploadedAt: new Date().toISOString()
            };
            console.log('Firestore에 저장할 데이터:', photoData);
            
            // Firestore에 문서 추가
            console.log('Firestore 문서 추가 시작');
            const docRef = await addDoc(collection(db, 'gallery'), photoData);
            console.log('Firestore 문서 추가 완료:', docRef.id);
            
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
            alert('사진이 성공적으로 업로드되었습니다.');
          } catch (err) {
            console.error('URL 가져오기 또는 Firestore 저장 중 오류:', err);
            alert(`사진 정보 저장 중 오류가 발생했습니다: ${err.message}`);
          }
        }
      );
    } catch (err) {
      console.error('사진 업로드 중 오류 발생:', err);
      alert(`사진 업로드 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 파일 선택 처리
  const handleFileChange = (e) => {
    console.log('파일 선택 이벤트 발생', e.target.files);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log('선택된 파일:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      setUploadForm({
        ...uploadForm,
        file: selectedFile
      });
    }
  };

  // 폼 입력 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 날짜 형식 검증 (YYYY/MM/DD)
    if (name === 'date') {
      // 숫자와 / 문자만 허용
      const sanitizedValue = value.replace(/[^\d/]/g, '');
      
      // 자동으로 / 추가
      let formattedValue = sanitizedValue;
      if (sanitizedValue.length === 4 && !sanitizedValue.includes('/')) {
        formattedValue = sanitizedValue + '/';
      } else if (sanitizedValue.length === 7 && sanitizedValue.split('/').length === 2) {
        formattedValue = sanitizedValue + '/';
      }
      
      setUploadForm({
        ...uploadForm,
        [name]: formattedValue
      });
      return;
    }
    
    setUploadForm({
      ...uploadForm,
      [name]: value
    });
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
      // Firestore에서 문서 삭제
      await deleteDoc(doc(db, 'gallery', photo.id));
      
      // Storage에서 파일 삭제
      const storageRef = ref(storage, `gallery/${photo.fileName}`);
      await deleteObject(storageRef);
      
      // 상태 업데이트
      setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photo.id));
      
      if (isViewModalOpen && selectedPhoto?.id === photo.id) {
        setIsViewModalOpen(false);
      }
      
      alert('사진이 성공적으로 삭제되었습니다.');
    } catch (err) {
      console.error('사진 삭제 중 오류 발생:', err);
      alert('사진 삭제 중 오류가 발생했습니다.');
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
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Westerners - 갤러리</title>
        <meta name="description" content="Westerners 모임의 정기 모임 사진 갤러리" />
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
            
            <div className="space-y-4">
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
                  onChange={handleFileChange}
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
                  type="button"
                  onClick={(e) => {
                    console.log('업로드 버튼 직접 클릭됨');
                    handleUpload(e);
                  }}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  disabled={uploadProgress > 0 && uploadProgress < 100}
                >
                  업로드
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 사진 보기 모달 */}
      {isViewModalOpen && selectedPhoto && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
          <div className="p-6">
            <div className="relative w-full h-64 sm:h-96 mb-4">
              <Image 
                src={selectedPhoto.imageUrl} 
                alt={selectedPhoto.title}
                layout="fill"
                objectFit="contain"
              />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-gray-800">{selectedPhoto.title}</h2>
            <p className="text-sm text-gray-500 mb-4">{formatDate(selectedPhoto.date)}</p>
            
            {selectedPhoto.description && (
              <p className="text-gray-700 mb-6">{selectedPhoto.description}</p>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={() => handleDeletePhoto(selectedPhoto)}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                삭제하기
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Footer />
    </div>
  );
} 