import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Modal from '../../components/Modal';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../lib/authContext';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../lib/firestoreService';

export default function MembersManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'member',
    password: ''
  });
  const [adminPassword, setAdminPassword] = useState('');
  const { hasPermission, currentUser } = useAuth();
  const router = useRouter();

  // 데이터 로드 함수
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await getAllUsers();
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
        role: user.role || 'member',
        password: '' // 비밀번호는 표시하지 않음
      });
    } else {
      setFormData({
        email: '',
        name: '',
        phone: '',
        role: 'member',
        password: ''
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
      role: 'member',
      password: ''
    });
    setAdminPassword(''); // 관리자 비밀번호 초기화
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
        if (!formData.email || !formData.password) {
          setError('이메일과 비밀번호는 필수 입력 항목입니다.');
          return;
        }
        
        if (!adminPassword) {
          setError('관리자 비밀번호를 입력해주세요. 새 계정 생성 후 다시 관리자 계정으로 로그인하기 위해 필요합니다.');
          return;
        }
        
        // 관리자 정보를 함께 전달
        await createUser(
          formData.email, 
          formData.password, 
          {
            name: formData.name,
            phone: formData.phone,
            role: formData.role
          },
          {
            email: currentUser.email,
            password: adminPassword
          }
        );
      } else if (modalType === 'edit') {
        if (!selectedUser) return;
        
        const userData = {
          name: formData.name,
          phone: formData.phone,
          role: formData.role
        };
        
        await updateUser(selectedUser.id, userData);
      }
      
      await loadUsers();
      setAdminPassword(''); // 관리자 비밀번호 초기화
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
      await deleteUser(userId);
      await loadUsers();
    } catch (err) {
      console.error('회원 삭제 중 오류 발생:', err);
      setError('회원을 삭제하는 중 오류가 발생했습니다.');
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
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleOpenModal('edit', user)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDelete(user.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    삭제
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
          title={modalType === 'add' ? '계정 추가' : '계정 정보 수정'}
        >
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
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    임시 비밀번호
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="임시 비밀번호를 입력하세요"
                    required={modalType === 'add'}
                  />
                  <p className="text-xs text-gray-500 mt-1">최소 6자 이상이어야 합니다</p>
                </div>
                
                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    관리자 비밀번호
                  </label>
                  <input
                    type="password"
                    id="adminPassword"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="현재 관리자 비밀번호를 입력하세요"
                    required={modalType === 'add'}
                  />
                  <p className="text-xs text-gray-500 mt-1">계정 생성 후 다시 관리자로 로그인하기 위해 필요합니다</p>
                </div>
              </>
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
        </Modal>
      </div>
    </ProtectedRoute>
  );
} 