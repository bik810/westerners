import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, where, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../lib/authContext';

export default function GroupInfo() {
  const [activeTab, setActiveTab] = useState('members');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [isExecutiveModalOpen, setIsExecutiveModalOpen] = useState(false);
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [executiveFormData, setExecutiveFormData] = useState({
    generation: '',
    president: '',
    treasurer: '',
    term: ''
  });
  const [rulesData, setRulesData] = useState({
    general: [],
    members: [],
    finance: [],
    regular: [],
    safety: []
  });
  const [rulesActiveTab, setRulesActiveTab] = useState('general');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const { userProfile } = useAuth();
  
  // 권한 확인 함수
  const canEdit = userProfile && (userProfile.role === 'admin' || userProfile.role === 'treasurer');
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: '',
    role: 'member',
    age: '',
    birthday: '',
    children: ''
  });

  // 회원 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 회원 정보 가져오기
        const membersQuery = query(collection(db, 'memberInfo'));
        const membersSnapshot = await getDocs(membersQuery);
        
        const membersData = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(member => !member.deleted); // 삭제된 회원 필터링
        
        // 회원 정렬: 회장 > 총무 > 일반회원(나이 내림차순, 이름 오름차순)
        const sortedMembers = sortMembers(membersData);
        
        setMembers(sortedMembers);
        
        // 임원단 정보 가져오기
        const executivesQuery = query(collection(db, 'executives'), orderBy('generation', 'desc'));
        const executivesSnapshot = await getDocs(executivesQuery);
        
        const executivesData = executivesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setExecutives(executivesData);
        
        // 회칙 정보 가져오기
        const rulesRef = doc(db, 'settings', 'rules');
        const rulesSnapshot = await getDoc(rulesRef);
        
        if (rulesSnapshot.exists()) {
          setRulesData(rulesSnapshot.data());
        }
        
        setError(null);
      } catch (err) {
        console.error('데이터 로드 중 오류 발생:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 회원 정렬 함수
  const sortMembers = (members) => {
    return [...members].sort((a, b) => {
      // 역할 우선순위: 회장(president) > 총무(treasurer) > 일반회원(member)
      const roleOrder = { president: 1, treasurer: 2, member: 3, admin: 4 };
      const roleA = roleOrder[a.role] || 999;
      const roleB = roleOrder[b.role] || 999;
      
      // 역할이 다르면 역할 순서대로 정렬
      if (roleA !== roleB) {
        return roleA - roleB;
      }
      
      // 역할이 같고 일반회원인 경우
      if (roleA === 3) {
        // 나이가 있는 경우 나이 내림차순 (나이 많은 순)
        const ageA = parseInt(a.age) || 0;
        const ageB = parseInt(b.age) || 0;
        
        if (ageA !== ageB) {
          return ageB - ageA;
        }
        
        // 나이가 같으면 이름 가나다순
        return (a.name || '').localeCompare(b.name || '', 'ko');
      }
      
      // 그 외의 경우 이름 가나다순
      return (a.name || '').localeCompare(b.name || '', 'ko');
    });
  };

  // 모달 열기 함수
  const handleOpenModal = (member = null) => {
    setSelectedMember(member);
    
    if (member) {
      setFormData({
        name: member.name || '',
        role: member.role || 'member',
        age: member.age || '',
        birthday: member.birthday || '',
        children: member.children || ''
      });
    } else {
      setFormData({
        name: '',
        role: 'member',
        age: '',
        birthday: '',
        children: ''
      });
    }
    
    setIsModalOpen(true);
  };

  // 모달 닫기 함수
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
    setFormData({
      name: '',
      role: 'member',
      age: '',
      birthday: '',
      children: ''
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
      const memberData = {
        name: formData.name,
        role: formData.role,
        age: formData.age,
        birthday: formData.birthday,
        children: formData.children,
        updatedAt: new Date().toISOString()
      };
      
      if (selectedMember) {
        // 기존 회원 정보 수정
        await setDoc(doc(db, 'memberInfo', selectedMember.id), memberData, { merge: true });
        
        // 상태 업데이트 (정렬 적용)
        setMembers(prev => {
          const updated = prev.map(m => 
            m.id === selectedMember.id ? { id: selectedMember.id, ...memberData } : m
          );
          return sortMembers(updated);
        });
      } else {
        // 새 회원 정보 추가
        const newDocRef = doc(collection(db, 'memberInfo'));
        await setDoc(newDocRef, {
          ...memberData,
          createdAt: new Date().toISOString()
        });
        
        // 상태 업데이트 (정렬 적용)
        setMembers(prev => {
          const newMember = { 
            id: newDocRef.id, 
            ...memberData, 
            createdAt: new Date().toISOString() 
          };
          return sortMembers([...prev, newMember]);
        });
      }
      
      handleCloseModal();
      alert(selectedMember ? '회원 정보가 수정되었습니다.' : '회원 정보가 추가되었습니다.');
    } catch (err) {
      console.error('회원 정보 저장 중 오류 발생:', err);
      alert('회원 정보를 저장하는 중 오류가 발생했습니다.');
    }
  };

  // 회원 삭제 처리
  const handleDelete = async (memberId) => {
    if (!confirm('정말로 이 회원 정보를 삭제하시겠습니까?')) return;
    
    try {
      // Firestore에서 문서 삭제
      await setDoc(doc(db, 'memberInfo', memberId), { deleted: true }, { merge: true });
      
      // 상태 업데이트
      setMembers(prev => prev.filter(m => m.id !== memberId));
      
      alert('회원 정보가 삭제되었습니다.');
    } catch (err) {
      console.error('회원 정보 삭제 중 오류 발생:', err);
      alert('회원 정보를 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 역할에 따른 표시 텍스트
  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return '관리자(시스템)';
      case 'treasurer':
        return '총무';
      case 'president':
        return '회장';
      default:
        return '일반회원';
    }
  };

  // 역할에 따른 배경색 클래스
  const getRoleColorClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'treasurer':
        return 'bg-green-100 text-green-800';
      case 'president':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // 임원단 모달 열기 함수
  const handleOpenExecutiveModal = (executive = null) => {
    setSelectedExecutive(executive);
    
    if (executive) {
      setExecutiveFormData({
        generation: executive.generation || '',
        president: executive.president || '',
        treasurer: executive.treasurer || '',
        term: executive.term || ''
      });
    } else {
      setExecutiveFormData({
        generation: '',
        president: '',
        treasurer: '',
        term: ''
      });
    }
    
    setIsExecutiveModalOpen(true);
  };

  // 임원단 모달 닫기 함수
  const handleCloseExecutiveModal = () => {
    setIsExecutiveModalOpen(false);
    setSelectedExecutive(null);
    setExecutiveFormData({
      generation: '',
      president: '',
      treasurer: '',
      term: ''
    });
  };

  // 임원단 폼 데이터 변경 처리
  const handleExecutiveFormChange = (e) => {
    const { name, value } = e.target;
    setExecutiveFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 임원단 폼 제출 처리
  const handleExecutiveSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const executiveData = {
        generation: executiveFormData.generation,
        president: executiveFormData.president,
        treasurer: executiveFormData.treasurer,
        term: executiveFormData.term,
        updatedAt: new Date().toISOString()
      };
      
      if (selectedExecutive) {
        // 기존 임원단 정보 수정
        await setDoc(doc(db, 'executives', selectedExecutive.id), executiveData, { merge: true });
        
        // 상태 업데이트
        setExecutives(prev => {
          const updated = prev.map(e => 
            e.id === selectedExecutive.id ? { id: selectedExecutive.id, ...executiveData } : e
          );
          return updated.sort((a, b) => parseInt(b.generation) - parseInt(a.generation));
        });
      } else {
        // 새 임원단 정보 추가
        const newDocRef = doc(collection(db, 'executives'));
        await setDoc(newDocRef, {
          ...executiveData,
          createdAt: new Date().toISOString()
        });
        
        // 상태 업데이트
        setExecutives(prev => {
          const newExecutive = { 
            id: newDocRef.id, 
            ...executiveData, 
            createdAt: new Date().toISOString() 
          };
          return [newExecutive, ...prev].sort((a, b) => parseInt(b.generation) - parseInt(a.generation));
        });
      }
      
      handleCloseExecutiveModal();
      alert(selectedExecutive ? '임원단 정보가 수정되었습니다.' : '임원단 정보가 추가되었습니다.');
    } catch (err) {
      console.error('임원단 정보 저장 중 오류 발생:', err);
      alert('임원단 정보를 저장하는 중 오류가 발생했습니다.');
    }
  };

  // 임원단 삭제 처리
  const handleDeleteExecutive = async (executiveId) => {
    if (!confirm('정말로 이 임원단 정보를 삭제하시겠습니까?')) return;
    
    try {
      // Firestore에서 문서 삭제
      await deleteDoc(doc(db, 'executives', executiveId));
      
      // 상태 업데이트
      setExecutives(prev => prev.filter(e => e.id !== executiveId));
      
      alert('임원단 정보가 삭제되었습니다.');
    } catch (err) {
      console.error('임원단 정보 삭제 중 오류 발생:', err);
      alert('임원단 정보를 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 회칙 모달 열기
  const handleOpenRulesModal = () => {
    setIsRulesModalOpen(true);
  };

  // 회칙 모달 닫기
  const handleCloseRulesModal = () => {
    setIsRulesModalOpen(false);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Head>
          <title>Westerners - 모임 정보</title>
          <meta name="description" content="Westerners 모임 정보" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Header />

        {/* Hero Section */}
        <section className="pt-32 pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">모임 정보</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              서쪽모임의 회원 정보와 회칙을 확인하세요
            </p>
          </div>
        </section>

        {/* Content Section */}
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
                {/* Main Tabs */}
                <div className="flex flex-wrap border-b">
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                      activeTab === 'members'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-blue-600'
                    }`}
                  >
                    회원 정보
                  </button>
                  <button
                    onClick={() => setActiveTab('executives')}
                    className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                      activeTab === 'executives'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-blue-600'
                    }`}
                  >
                    임원단
                  </button>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                      activeTab === 'rules'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-blue-600'
                    }`}
                  >
                    회칙
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  {/* 회원 정보 탭 */}
                  {activeTab === 'members' && (
                    <div className="animate-fadeIn">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">회원 정보</h3>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            회원 정보 추가
                          </button>
                        )}
                      </div>
                      
                      <div className="overflow-x-auto">
                        {members.length > 0 ? (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  구분
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  이름
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  나이
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  생일
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  자녀 정보
                                </th>
                                {canEdit && (
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    관리
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {members.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors duration-200">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColorClass(member.role)}`}>
                                      {getRoleText(member.role)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-800">{member.name || '-'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    {member.age || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    {member.birthday || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    {member.children || '-'}
                                  </td>
                                  {canEdit && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleOpenModal(member)}
                                          className="text-blue-600 hover:text-blue-800"
                                        >
                                          수정
                                        </button>
                                        <button
                                          onClick={() => handleDelete(member.id)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            등록된 회원 정보가 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 임원단 탭 */}
                  {activeTab === 'executives' && (
                    <div className="animate-fadeIn">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">임원단 정보</h3>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenExecutiveModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            임원단 정보 추가
                          </button>
                        )}
                      </div>
                      
                      <div className="overflow-x-auto">
                        {executives.length > 0 ? (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  세대
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  회장
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  총무
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  임기
                                </th>
                                {canEdit && (
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    관리
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {executives.map((executive, index) => (
                                <tr 
                                  key={executive.id} 
                                  className={`hover:bg-gray-50 transition-colors duration-200 ${
                                    index === 0 ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {index === 0 ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        현재 {executive.generation}대
                                      </span>
                                    ) : (
                                      `${executive.generation}대`
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {executive.president}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {executive.treasurer}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {executive.term}
                                  </td>
                                  {canEdit && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleOpenExecutiveModal(executive)}
                                          className="text-blue-600 hover:text-blue-800"
                                        >
                                          수정
                                        </button>
                                        <button
                                          onClick={() => handleDeleteExecutive(executive.id)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            등록된 임원단 정보가 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 회칙 탭 */}
                  {activeTab === 'rules' && (
                    <div className="animate-fadeIn">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Westerners 회칙</h3>
                        <button 
                          onClick={handleOpenRulesModal}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                          회칙 상세 보기
                        </button>
                      </div>
                      
                      {/* Rules Tabs */}
                      <div className="flex flex-wrap border-b mb-6">
                        <button
                          onClick={() => setRulesActiveTab('general')}
                          className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                            rulesActiveTab === 'general'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          제 1 장 단체 정의
                        </button>
                        <button
                          onClick={() => setRulesActiveTab('members')}
                          className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                            rulesActiveTab === 'members'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          제 2 장 회원
                        </button>
                        <button
                          onClick={() => setRulesActiveTab('finance')}
                          className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                            rulesActiveTab === 'finance'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          제 3 장 재정
                        </button>
                        <button
                          onClick={() => setRulesActiveTab('regular')}
                          className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                            rulesActiveTab === 'regular'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          제 4 장 정기 모임
                        </button>
                        <button
                          onClick={() => setRulesActiveTab('safety')}
                          className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                            rulesActiveTab === 'safety'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          제 5 장 안전
                        </button>
                      </div>
                      
                      {/* Rules Content */}
                      <div className="space-y-6">
                        {rulesData[rulesActiveTab].length > 0 ? (
                          rulesData[rulesActiveTab].map((rule) => (
                            <div key={rule.id} className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                                제 {rule.chapter} 장 {rule.section} 조 {rule.title}
                              </h4>
                              <p className="text-gray-700 whitespace-pre-line">{rule.content}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            등록된 회칙이 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <Footer />

        {/* 회원 정보 모달 */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedMember ? '회원 정보 수정' : '회원 정보 추가'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
                required
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                구분
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">일반회원</option>
                <option value="president">회장</option>
                <option value="treasurer">총무</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                나이
              </label>
              <input
                type="text"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
                생일
              </label>
              <input
                type="text"
                id="birthday"
                name="birthday"
                value={formData.birthday}
                onChange={handleFormChange}
                placeholder="예: 1990/01/01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-1">
                자녀 정보
              </label>
              <input
                type="text"
                id="children"
                name="children"
                value={formData.children}
                onChange={handleFormChange}
                placeholder="예: 딸1, 아들2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
              >
                {selectedMember ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </Modal>

        {/* 임원단 모달 */}
        <Modal
          isOpen={isExecutiveModalOpen}
          onClose={handleCloseExecutiveModal}
          title={selectedExecutive ? '임원단 정보 수정' : '임원단 정보 추가'}
        >
          <form onSubmit={handleExecutiveSubmit} className="space-y-4">
            <div>
              <label htmlFor="generation" className="block text-sm font-medium text-gray-700 mb-1">
                세대
              </label>
              <input
                type="text"
                id="generation"
                name="generation"
                value={executiveFormData.generation}
                onChange={handleExecutiveFormChange}
                placeholder="예: 7"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="president" className="block text-sm font-medium text-gray-700 mb-1">
                회장
              </label>
              <input
                type="text"
                id="president"
                name="president"
                value={executiveFormData.president}
                onChange={handleExecutiveFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="treasurer" className="block text-sm font-medium text-gray-700 mb-1">
                총무
              </label>
              <input
                type="text"
                id="treasurer"
                name="treasurer"
                value={executiveFormData.treasurer}
                onChange={handleExecutiveFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">
                임기
              </label>
              <input
                type="text"
                id="term"
                name="term"
                value={executiveFormData.term}
                onChange={handleExecutiveFormChange}
                placeholder="예: 2024년 12월 - 2025년 5월"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCloseExecutiveModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
              >
                {selectedExecutive ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </Modal>

        {/* 회칙 모달 */}
        <Modal
          isOpen={isRulesModalOpen}
          onClose={handleCloseRulesModal}
          title="Westerners 회칙 전체 보기"
          size="lg"
        >
          <div className="space-y-8 max-h-[70vh] overflow-y-auto p-2">
            {/* 제 1 장 */}
            <div>
              <h3 className="text-xl font-bold text-blue-800 mb-4 pb-2 border-b border-blue-200">제 1 장 단체 정의</h3>
              <div className="space-y-4">
                {rulesData.general.length > 0 ? (
                  rulesData.general.map((rule) => (
                    <div key={rule.id} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        제 {rule.chapter} 장 {rule.section} 조 {rule.title}
                      </h4>
                      <p className="text-gray-700 whitespace-pre-line">{rule.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">등록된 회칙이 없습니다.</p>
                )}
              </div>
            </div>
            
            {/* 제 2 장 */}
            <div>
              <h3 className="text-xl font-bold text-blue-800 mb-4 pb-2 border-b border-blue-200">제 2 장 회원</h3>
              <div className="space-y-4">
                {rulesData.members.length > 0 ? (
                  rulesData.members.map((rule) => (
                    <div key={rule.id} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        제 {rule.chapter} 장 {rule.section} 조 {rule.title}
                      </h4>
                      <p className="text-gray-700 whitespace-pre-line">{rule.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">등록된 회칙이 없습니다.</p>
                )}
              </div>
            </div>
            
            {/* 제 3 장 */}
            <div>
              <h3 className="text-xl font-bold text-blue-800 mb-4 pb-2 border-b border-blue-200">제 3 장 재정</h3>
              <div className="space-y-4">
                {rulesData.finance.length > 0 ? (
                  rulesData.finance.map((rule) => (
                    <div key={rule.id} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        제 {rule.chapter} 장 {rule.section} 조 {rule.title}
                      </h4>
                      <p className="text-gray-700 whitespace-pre-line">{rule.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">등록된 회칙이 없습니다.</p>
                )}
              </div>
            </div>
            
            {/* 제 4 장 */}
            <div>
              <h3 className="text-xl font-bold text-blue-800 mb-4 pb-2 border-b border-blue-200">제 4 장 정기 모임</h3>
              <div className="space-y-4">
                {rulesData.regular.length > 0 ? (
                  rulesData.regular.map((rule) => (
                    <div key={rule.id} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        제 {rule.chapter} 장 {rule.section} 조 {rule.title}
                      </h4>
                      <p className="text-gray-700 whitespace-pre-line">{rule.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">등록된 회칙이 없습니다.</p>
                )}
              </div>
            </div>
            
            {/* 제 5 장 */}
            <div>
              <h3 className="text-xl font-bold text-blue-800 mb-4 pb-2 border-b border-blue-200">제 5 장 안전</h3>
              <div className="space-y-4">
                {rulesData.safety.length > 0 ? (
                  rulesData.safety.map((rule) => (
                    <div key={rule.id} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        제 {rule.chapter} 장 {rule.section} 조 {rule.title}
                      </h4>
                      <p className="text-gray-700 whitespace-pre-line">{rule.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">등록된 회칙이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCloseRulesModal}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </Modal>

        <style jsx>{`
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
} 