import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Modal from '../../components/Modal';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../lib/authContext';
import * as FirestoreService from '../../lib/firestoreService';

export default function MembersManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'view'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'member'
  });
  const { hasPermission } = useAuth();
  const router = useRouter();

  // 데이터 로드 함수
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await FirestoreService.getAllUsers();
      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error('회원 데이터 로드 중 오류 발생:', err);
      setError('회원 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadUsers();
  }, []);

  // 모달 열기 함수
  const handleOpenModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    
    if (user) {
      setFormData({
        email: user.email || '',
        name: user.name || '',
        phone: user.phone || '',
        role: user.role || 'member'
      });
    } else {
      setFormData({
        email: '',
        name: '',
        phone: '',
        role: 'member'
      });
    }
    
    setIsModalOpen(true);
  };

  // 모달 닫기 함수
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType('');
    setSelectedUser(null);
    setFormData({
      email: '',
      name: '',
      phone: '',
      role: 'member'
    });
  };

  // 폼 데이터 변경 처리
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'add') {
        if (!formData.email) {
          setError('이메일은 필수 입력 항목입니다.');
          return;
        }
        
        console.log('계정 추가 시작:', formData.email);
        
        // 이메일 링크를 통한 계정 생성
        try {
          const userData = {
            name: formData.name,
            phone: formData.phone,
            role: formData.role
          };
          
          console.log('createUserWithEmail 함수 타입:', typeof FirestoreService.createUserWithEmail);
          
          // 함수 참조 문제를 해결하기 위한 안전한 호출 방식 사용
          const createUserFn = FirestoreService.createUserWithEmail;
          if (typeof createUserFn !== 'function') {
            console.error('createUserWithEmail 함수가 정의되지 않았습니다', FirestoreService);
            throw new Error('계정 생성 함수를 찾을 수 없습니다. 개발자에게 문의하세요.');
          }

          console.log('createUserWithEmail 함수 호출 직전', { email: formData.email });
          await createUserFn(formData.email, userData);
          console.log('계정 추가 성공');
          alert(`"${formData.email}" 계정이 생성되었습니다.\n\n1. 이메일 주소 인증 링크가 전송되었습니다. 사용자가 이메일 인증을 완료해야 합니다.\n2. 비밀번호 설정 링크도 함께 전송되었습니다. 사용자는 이 링크로 비밀번호를 설정한 후 로그인할 수 있습니다.`);
        } catch (addError) {
          console.error('계정 추가 중 상세 오류:', addError);
          
          // 사용자 친화적인 오류 메시지 표시
          // FirestoreService에서 변환된 오류 메시지 사용
          const errorMessage = addError.message || '계정 추가 중 오류가 발생했습니다.';
          setError(errorMessage);
          
          // 이미 사용 중인 이메일인 경우 알림창으로도 표시
          if (errorMessage.includes('이미 사용 중인 이메일')) {
            alert(errorMessage);
          }
          return;
        }
      } else if (modalType === 'edit') {
        if (!selectedUser) return;
        
        const userData = {
          name: formData.name,
          phone: formData.phone,
          role: formData.role
        };
        
        await FirestoreService.updateUser(selectedUser.id, userData);
      }
      
      await loadUsers();
      handleCloseModal();
    } catch (err) {
      console.error('회원 데이터 처리 중 오류 발생:', err);
      setError('회원 데이터를 처리하는 중 오류가 발생했습니다.');
    }
  };

  // 회원 삭제 처리
  const handleDelete = async (userId) => {
    if (!window.confirm('정말로 이 회원을 삭제하시겠습니까?')) return;
    
    try {
      await FirestoreService.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      console.error('회원 삭제 중 오류 발생:', err);
      setError('회원을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 비밀번호 재설정 처리
  const handleResetPassword = async (email) => {
    try {
      await FirestoreService.sendPasswordReset(email);
      alert(`"${email}" 주소로 비밀번호 재설정 링크가 전송되었습니다.`);
    } catch (err) {
      console.error('비밀번호 재설정 링크 전송 중 오류 발생:', err);
      setError('비밀번호 재설정 링크를 전송하는 중 오류가 발생했습니다.');
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex flex-col min-h-screen">
        <Head>
          <title>Westerners - 계정 관리</title>
          <meta name="description" content="Westerners 모임 계정 관리" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Header />

        <section className="pt-32 pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">계정 관리</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Westerners 모임 계정을 관리합니다
            </p>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            {isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                <strong className="font-bold">오류!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">계정 목록</h3>
                    <button
                      onClick={() => handleOpenModal('add')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      계정 추가
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    {users.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              이름
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              이메일
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              연락처
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              권한
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              가입일
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              관리
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-800">{user.name || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                {user.phone || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : user.role === 'treasurer' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.role === 'admin' 
                                    ? '관리자' 
                                    : user.role === 'treasurer' 
                                      ? '총무' 
                                      : '일반회원'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => handleOpenModal('view', user)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors duration-200"
                                  >
                                    상세
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500 text-center py-8">등록된 회원이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <Footer />

        {/* 계정 추가/수정 모달 */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={
            modalType === 'add' 
              ? '계정 추가' 
              : modalType === 'edit' 
                ? '계정 정보 수정' 
                : '회원 상세 정보'
          }
        >
          {modalType === 'view' ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">회원 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">이름</p>
                    <p className="text-base text-gray-900">{selectedUser?.name || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">이메일</p>
                    <p className="text-base text-gray-900">{selectedUser?.email || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">연락처</p>
                    <p className="text-base text-gray-900">{selectedUser?.phone || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">권한</p>
                    <p className="text-base text-gray-900">
                      {selectedUser?.role === 'admin' 
                        ? '관리자' 
                        : selectedUser?.role === 'treasurer' 
                          ? '총무' 
                          : '일반회원'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-gray-500">계정 생성일</p>
                <p className="text-sm text-gray-700">
                  {selectedUser?.createdAt 
                    ? new Date(selectedUser.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-'}
                </p>
              </div>
              
              <div className="flex flex-col space-y-4 mt-6">
                <div className="flex space-x-3 justify-start">
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenModal('edit', selectedUser);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                    수정
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleResetPassword(selectedUser.email)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                    </svg>
                    비밀번호 재설정
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    setTimeout(() => {
                      if (window.confirm('정말로 이 회원을 삭제하시겠습니까?')) {
                        handleDelete(selectedUser.id);
                      }
                    }, 300);
                  }}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  계정 삭제
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이메일 주소를 입력하세요"
                  required
                  disabled={modalType === 'edit'} // 수정 시에는 이메일 변경 불가
                />
              </div>
              
              {modalType === 'add' && (
                <div className="bg-blue-50 p-4 rounded-md mb-4 text-sm text-blue-700">
                  <p className="font-medium">계정이 생성되면 입력한 이메일로 비밀번호 설정 링크가 전송됩니다.</p>
                  <p className="mt-1">회원은 이메일에 포함된 링크를 통해 직접 비밀번호를 설정할 수 있습니다.</p>
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이름을 입력하세요"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="연락처를 입력하세요"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  권한
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">일반회원</option>
                  <option value="treasurer">총무</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white font-medium rounded-md bg-blue-600 hover:bg-blue-700"
                >
                  {modalType === 'add' ? '추가' : '수정'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </ProtectedRoute>
  );
} 