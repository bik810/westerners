import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import { getAllMembers, getAllExpenses, addMember, updateMember, deleteMember, addExpense, updateExpense, deleteExpense } from '../lib/firestoreService';
import { useAuth } from '../lib/authContext';

export default function Fees() {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userProfile } = useAuth();
  
  // 권한 확인 함수
  const canEdit = userProfile && (userProfile.role === 'admin' || userProfile.role === 'treasurer');
  
  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add-income', 'edit-income', 'add-expense', 'edit-expense'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    details: '',
    amount: '',
    remarks: ''
  });

  // 데이터 로드 함수
  const loadData = async () => {
    try {
      setIsLoading(true);
      const membersData = await getAllMembers();
      const expensesData = await getAllExpenses();
      
      // 날짜 기준 내림차순 정렬 (최신순)
      const sortByDateDesc = (a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      };
      
      // 정렬된 데이터 설정
      setMembers(membersData.sort(sortByDateDesc));
      setExpenses(expensesData.sort(sortByDateDesc));
      setError(null);
    } catch (err) {
      console.error('데이터 로드 중 오류 발생:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const totalIncome = members.reduce((sum, member) => sum + member.amount, 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const balance = totalIncome - totalExpense;

  // 금액 포맷 함수 수정
  const formatCurrency = (amount) => {
    // 소수점 둘째 자리까지 표시하고 천 단위 구분 기호 추가
    return `S$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // 날짜 포맷 함수 수정
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // 날짜 문자열을 Date 객체로 변환
    const date = new Date(dateString);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) return dateString;
    
    // YYYY/MM/DD 형식으로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  };

  // 모달 열기 함수
  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    if (item) {
      setFormData({
        date: formatDate(item.date),
        details: type.includes('income') ? item.name : item.description,
        amount: item.amount.toString(),
        remarks: item.note || ''
      });
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      setFormData({
        date: `${year}/${month}/${day}`,
        details: '',
        amount: '',
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  // 모달 닫기 함수
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType('');
    setSelectedItem(null);
    setFormData({
      date: '',
      details: '',
      amount: '',
      remarks: ''
    });
  };

  // 날짜 변환 함수 추가
  const convertDateFormat = (dateString) => {
    if (!dateString) return '';
    
    // 날짜 문자열이 이미 YYYY-MM-DD 형식인지 확인
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // MM/DD/YYYY 형식을 YYYY-MM-DD 형식으로 변환
    const parts = dateString.split('/');
    if (parts.length === 3) {
      // 브라우저에 따라 MM/DD/YYYY 형식으로 표시될 수 있음
      if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
      // YYYY/MM/DD 형식으로 입력된 경우
      else if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
    
    return dateString;
  };

  // 폼 데이터 변경 처리
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      // 이전 값 가져오기
      const prevValue = formData.date;
      
      // 백스페이스로 지우는 경우 특별 처리
      if (prevValue.length > value.length) {
        // 마지막 문자가 슬래시인 경우 슬래시와 그 앞 숫자까지 함께 지움
        if (prevValue.endsWith('/') && !value.endsWith('/')) {
          const newValue = value.slice(0, -1);
          setFormData(prev => ({
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
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // 입력 검증
      if (!formData.date.trim()) {
        throw new Error('날짜를 입력해주세요.');
      }
      
      if (!formData.details.trim()) {
        throw new Error(modalType.includes('income') ? '이름을 입력해주세요.' : '내역을 입력해주세요.');
      }
      
      if (!formData.amount.trim() || isNaN(parseFloat(formData.amount))) {
        throw new Error('유효한 금액을 입력해주세요.');
      }
      
      // 날짜 형식 변환 (YYYY/MM/DD -> YYYY-MM-DD)
      const formattedDate = formData.date.replace(/\//g, '-');
      
      // 데이터 준비
      const amount = parseFloat(formData.amount);
      
      if (modalType === 'add-income') {
        // 수입 추가
        const newMember = {
          name: formData.details,
          amount: amount,
          date: formattedDate,
          note: formData.remarks
        };
        
        const docRef = await addMember(newMember);
        
        // 상태 업데이트 (날짜 기준 정렬 유지)
        const newMemberWithId = { id: docRef.id, ...newMember };
        setMembers(prev => [newMemberWithId, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
        
      } else if (modalType === 'edit-income') {
        // 수입 수정
        const updatedMember = {
          name: formData.details,
          amount: amount,
          date: formattedDate,
          note: formData.remarks
        };
        
        await updateMember(selectedItem.id, updatedMember);
        
        // 상태 업데이트 (날짜 기준 정렬 유지)
        setMembers(prev => 
          prev.map(item => item.id === selectedItem.id ? { id: selectedItem.id, ...updatedMember } : item)
             .sort((a, b) => new Date(b.date) - new Date(a.date))
        );
        
      } else if (modalType === 'add-expense') {
        // 지출 추가
        const newExpense = {
          description: formData.details,
          amount: amount,
          date: formattedDate,
          note: formData.remarks
        };
        
        const docRef = await addExpense(newExpense);
        
        // 상태 업데이트 (날짜 기준 정렬 유지)
        const newExpenseWithId = { id: docRef.id, ...newExpense };
        setExpenses(prev => [newExpenseWithId, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
        
      } else if (modalType === 'edit-expense') {
        // 지출 수정
        const updatedExpense = {
          description: formData.details,
          amount: amount,
          date: formattedDate,
          note: formData.remarks
        };
        
        await updateExpense(selectedItem.id, updatedExpense);
        
        // 상태 업데이트 (날짜 기준 정렬 유지)
        setExpenses(prev => 
          prev.map(item => item.id === selectedItem.id ? { id: selectedItem.id, ...updatedExpense } : item)
             .sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      }
      
      // 모달 닫기
      setIsModalOpen(false);
      setModalType('');
      setSelectedItem(null);
      setFormData({
        date: '',
        details: '',
        amount: '',
        remarks: ''
      });
      
    } catch (err) {
      console.error('폼 제출 중 오류 발생:', err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 삭제 처리
  const handleDelete = async (type, id) => {
    if (!confirm(`정말로 이 ${type === 'income' ? '수입' : '지출'} 내역을 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (type === 'income') {
        await deleteMember(id);
        setMembers(prev => prev.filter(item => item.id !== id));
      } else {
        await deleteExpense(id);
        setExpenses(prev => prev.filter(item => item.id !== id));
      }
      
    } catch (err) {
      console.error('삭제 중 오류 발생:', err);
      alert(`삭제 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole={null}>
      <div className="flex flex-col min-h-screen">
        <Head>
          <title>Westerners - 회비 관리</title>
          <meta name="description" content="Westerners 모임 회비 관리" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Header />

        <section className="pt-32 pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">회비 관리</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              모임의 회비 수입과 지출을 관리하고 투명하게 공개합니다.
            </p>
          </div>
        </section>

        {/* Dashboard */}
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
              <>
                {/* Tabs & Content */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                  {/* Tabs */}
                  <div className="flex flex-wrap border-b">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                        activeTab === 'overview'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-blue-600'
                      }`}
                    >
                      개요
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                        activeTab === 'members'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-blue-600'
                      }`}
                    >
                      회비 수입 내역
                    </button>
                    <button
                      onClick={() => setActiveTab('expenses')}
                      className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                        activeTab === 'expenses'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-blue-600'
                      }`}
                    >
                      회비 지출 내역
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-8">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="animate-fadeIn">
                        {/* 재정 현황 */}
                        <div className="mb-8">
                          <h3 className="text-xl font-bold mb-4 text-gray-800">재정 현황</h3>
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">총 수입</h4>
                                  <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(totalIncome)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">총 지출</h4>
                                  <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(totalExpense)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">잔액</h4>
                                  <div className={`text-2xl font-bold text-blue-600`}>
                                    {formatCurrency(balance)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h3 className="text-xl font-bold mb-4 text-gray-800">최근 수입 내역</h3>
                            <div className="bg-gray-50 p-6 rounded-lg">
                              {members.length > 0 ? (
                                <ul className="space-y-4">
                                  {members.slice(0, 3).map(member => (
                                    <li key={member.id} className="flex justify-between items-center">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                          </svg>
                                        </div>
                                        <span className="font-medium text-gray-800">{member.name}</span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm text-gray-500">{formatDate(member.date)}</div>
                                        <div className="font-semibold text-green-600">
                                          {formatCurrency(member.amount)}
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500 text-center py-4">납부 내역이 없습니다.</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-xl font-bold mb-4 text-gray-800">최근 지출 내역</h3>
                            <div className="bg-gray-50 p-6 rounded-lg">
                              {expenses.length > 0 ? (
                                <ul className="space-y-4">
                                  {expenses.slice(0, 3).map(expense => (
                                    <li key={expense.id} className="flex justify-between items-center">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-3">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                                          </svg>
                                        </div>
                                        <span className="font-medium text-gray-800">{expense.description}</span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm text-gray-500">{formatDate(expense.date)}</div>
                                        <div className="font-semibold text-red-600">
                                          {formatCurrency(expense.amount)}
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500 text-center py-4">지출 내역이 없습니다.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                      <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-gray-800">회비 수입 내역</h3>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenModal('add-income')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300"
                            >
                              회비 수입 추가
                            </button>
                          )}
                        </div>
                        
                        <div className="overflow-x-auto bg-white rounded-lg">
                          {members.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    날짜
                                  </th>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    내역
                                  </th>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    금액
                                  </th>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    비고
                                  </th>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    관리
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {members.map((member) => (
                                  <tr key={member.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                      {formatDate(member.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                          </svg>
                                        </div>
                                        <div className="font-medium text-gray-800">{member.name || '회비 납부'}</div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">
                                      {formatCurrency(member.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                      {member.note || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      {canEdit && (
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleOpenModal('edit-income', member)}
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            수정
                                          </button>
                                          <button
                                            onClick={() => handleDelete('income', member.id)}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            삭제
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-gray-500 text-center py-8">수입 내역이 없습니다.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expenses Tab */}
                    {activeTab === 'expenses' && (
                      <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-gray-800">회비 지출 내역</h3>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenModal('add-expense')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
                            >
                              회비 지출 추가
                            </button>
                          )}
                        </div>
                        
                        <div className="overflow-x-auto bg-white rounded-lg">
                          {expenses.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    날짜
                                  </th>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    내역
                                  </th>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    금액
                                  </th>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    비고
                                  </th>
                                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    관리
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {expenses.map((expense) => (
                                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                      {formatDate(expense.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-3">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                          </svg>
                                        </div>
                                        <div className="font-medium text-gray-800">{expense.description}</div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">
                                      {formatCurrency(expense.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                      {expense.note || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      {canEdit && (
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleOpenModal('edit-expense', expense)}
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            수정
                                          </button>
                                          <button
                                            onClick={() => handleDelete('expense', expense.id)}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            삭제
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-gray-500 text-center py-8">지출 내역이 없습니다.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <Footer />

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={
            modalType === 'add-income' ? '수입 추가' :
            modalType === 'edit-income' ? '수입 수정' :
            modalType === 'add-expense' ? '지출 추가' :
            '지출 수정'
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                날짜
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
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
                    setFormData(prev => ({
                      ...prev,
                      date: `${year}/${month}/${day}`
                    }));
                  }}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors whitespace-nowrap"
                >
                  오늘
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                예: 2023/12/25
              </div>
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                {modalType.includes('income') ? '수입 내역' : '지출 내역'}
              </label>
              <input
                type="text"
                id="details"
                name="details"
                value={formData.details}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                금액
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">S$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                표시 형식: {formData.amount ? formatCurrency(Number(formData.amount)) : 'S$0.00'}
              </div>
            </div>
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                비고
              </label>
              <input
                type="text"
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleFormChange}
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
                className={`px-4 py-2 text-white font-medium rounded-md ${
                  modalType.includes('income')
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {modalType.startsWith('add') ? '추가' : '수정'}
              </button>
            </div>
          </form>
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