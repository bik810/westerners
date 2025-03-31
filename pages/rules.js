import Head from 'next/head';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../lib/authContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Rules() {
  const [activeTab, setActiveTab] = useState('general');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const { userProfile } = useAuth();
  
  // 권한 확인 함수
  const canEdit = userProfile && (userProfile.role === 'admin' || userProfile.role === 'treasurer');
  
  const [rulesData, setRulesData] = useState({
    general: {
      id: 'general',
      order: 1,
      title: '단체 정의',
      rules: []
    },
    members: {
      id: 'members',
      order: 2,
      title: '회원',
      rules: []
    },
    finance: {
      id: 'finance',
      order: 3,
      title: '재정',
      rules: []
    },
    regular: {
      id: 'regular',
      order: 4,
      title: '정기 모임',
      rules: []
    },
    safety: {
      id: 'safety',
      order: 5,
      title: '안전',
      rules: []
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firestore에서 회칙 데이터 불러오기
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setIsLoading(true);
        const rulesRef = doc(db, 'settings', 'rules');
        const rulesSnapshot = await getDoc(rulesRef);
        
        if (rulesSnapshot.exists()) {
          const data = rulesSnapshot.data();
          // 기존 데이터를 새로운 구조로 변환
          const convertedData = Object.keys(data).reduce((acc, key) => {
            acc[key] = {
              id: key,
              order: data[key].order,
              title: data[key].title || getDefaultTitle(key),
              rules: Array.isArray(data[key]) ? data[key] : data[key].rules || []
            };
            return acc;
          }, {});
          setRulesData(convertedData);
        } else {
          // 초기 데이터 설정
          const defaultRules = {
            general: {
              id: 'general',
              order: 1,
              title: '단체 정의',
              rules: [
                { id: 'g1', chapter: '1', section: '1', title: '명칭', content: '모임 명칭은 \'Westerners (한글명: 서쪽모임)\'으로 한다.' }
              ]
            },
            members: {
              id: 'members',
              order: 2,
              title: '회원',
              rules: [
                { id: 'm1', chapter: '2', section: '1', title: '구성', content: '모임은 회장 1명과 총무 1명의 임원단과 일반 회원들로 구성한다.' }
              ]
            },
            finance: {
              id: 'finance',
              order: 3,
              title: '재정',
              rules: [
                { id: 'f1', chapter: '3', section: '1', title: '회비', content: '정기 회비는 임원단은 월 SGD 40, 일반 회원은 월 SGD 50으로 정한다.' }
              ]
            },
            regular: {
              id: 'regular',
              order: 4,
              title: '정기 모임',
              rules: [
                { id: 'r1', chapter: '4', section: '1', title: '주기', content: '정기 모임은 2달 간격으로 진행한다.' }
              ]
            },
            safety: {
              id: 'safety',
              order: 5,
              title: '안전',
              rules: [
                { id: 's1', chapter: '5', section: '1', title: '안전', content: '정기 모임 시, 모임 규정에 포함될 안전 관련 의결을 진행한다.' }
              ]
            }
          };
          
          await setDoc(rulesRef, defaultRules);
          setRulesData(defaultRules);
        }
        setError(null);
      } catch (err) {
        console.error('회칙 데이터 로드 중 오류 발생:', err);
        setError('회칙 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRules();
  }, []);

  // 기본 제목 가져오기 함수
  const getDefaultTitle = (key) => {
    const titles = {
      general: '단체 정의',
      members: '회원',
      finance: '재정',
      regular: '정기 모임',
      safety: '안전'
    };
    return titles[key] || '';
  };

  // 장 제목 수정 함수
  const handleChapterTitleChange = async (category, newTitle) => {
    try {
      const updatedRulesData = {
        ...rulesData,
        [category]: {
          ...rulesData[category],
          title: newTitle
        }
      };

      // Firestore에 저장
      const rulesRef = doc(db, 'settings', 'rules');
      await setDoc(rulesRef, updatedRulesData);
      
      // 상태 업데이트
      setRulesData(updatedRulesData);
      
      alert('장 제목이 수정되었습니다.');
    } catch (err) {
      console.error('장 제목 수정 중 오류 발생:', err);
      alert('장 제목 수정 중 오류가 발생했습니다.');
    }
  };

  // 회칙 수정 모달 열기
  const handleEditRule = (rule) => {
    setEditingRule({ ...rule });
    setIsModalOpen(true);
  };

  // 회칙 저장
  const handleSaveRule = async () => {
    try {
      if (!editingRule) return;
      
      const updatedRules = rulesData[activeTab].rules.map(rule => 
        rule.id === editingRule.id ? editingRule : rule
      );
      
      if (!updatedRules.find(rule => rule.id === editingRule.id)) {
        updatedRules.push(editingRule);
      }
      
      const updatedRulesData = {
        ...rulesData,
        [activeTab]: {
          ...rulesData[activeTab],
          rules: updatedRules
        }
      };
      
      // Firestore에 저장
      const rulesRef = doc(db, 'settings', 'rules');
      await setDoc(rulesRef, updatedRulesData);
      
      // 상태 업데이트
      setRulesData(updatedRulesData);
      setIsModalOpen(false);
      setEditingRule(null);
      
      alert(editingRule.id ? '회칙이 수정되었습니다.' : '새 회칙이 추가되었습니다.');
    } catch (err) {
      console.error('회칙 저장 중 오류 발생:', err);
      alert('회칙 저장 중 오류가 발생했습니다.');
    }
  };

  // 회칙 추가
  const handleAddRule = () => {
    const newRule = {
      id: `${activeTab[0]}${rulesData[activeTab].rules.length + 1}`,
      chapter: activeTab === 'general' ? '1' : 
               activeTab === 'members' ? '2' : 
               activeTab === 'finance' ? '3' : 
               activeTab === 'regular' ? '4' : '5',
      section: `${rulesData[activeTab].rules.length + 1}`,
      title: '',
      content: ''
    };
    
    setEditingRule(newRule);
    setIsModalOpen(true);
  };

  // 회칙 삭제
  const handleDeleteRule = async (ruleId) => {
    if (!confirm('정말로 이 회칙을 삭제하시겠습니까?')) return;
    
    try {
      const updatedRules = rulesData[activeTab].rules.filter(rule => rule.id !== ruleId);
      
      const updatedRulesData = {
        ...rulesData,
        [activeTab]: {
          ...rulesData[activeTab],
          rules: updatedRules
        }
      };
      
      // Firestore에 저장
      const rulesRef = doc(db, 'settings', 'rules');
      await setDoc(rulesRef, updatedRulesData);
      
      // 상태 업데이트
      setRulesData(updatedRulesData);
      
      alert('회칙이 삭제되었습니다.');
    } catch (err) {
      console.error('회칙 삭제 중 오류 발생:', err);
      alert('회칙 삭제 중 오류가 발생했습니다.');
    }
  };

  // 장 추가 함수
  const handleAddChapter = async () => {
    try {
      const newId = `chapter_${Date.now()}`;
      const newOrder = Math.max(...Object.values(rulesData).map(chapter => chapter.order)) + 1;
      
      const updatedRulesData = {
        ...rulesData,
        [newId]: {
          id: newId,
          order: newOrder,
          title: `제 ${newOrder} 장`,
          rules: []
        }
      };

      // Firestore에 저장
      const rulesRef = doc(db, 'settings', 'rules');
      await setDoc(rulesRef, updatedRulesData);
      
      // 상태 업데이트
      setRulesData(updatedRulesData);
      setActiveTab(newId);
      
      alert('새로운 장이 추가되었습니다.');
    } catch (err) {
      console.error('장 추가 중 오류 발생:', err);
      alert('장 추가 중 오류가 발생했습니다.');
    }
  };

  // 장 삭제 함수
  const handleDeleteChapter = async (chapterId) => {
    if (!confirm('이 장을 삭제하시겠습니까? 포함된 모든 조항이 함께 삭제됩니다.')) return;
    
    try {
      const updatedRulesData = { ...rulesData };
      delete updatedRulesData[chapterId];

      // 순서 재정렬
      let order = 1;
      Object.values(updatedRulesData)
        .sort((a, b) => a.order - b.order)
        .forEach(chapter => {
          chapter.order = order++;
        });

      // Firestore에 저장
      const rulesRef = doc(db, 'settings', 'rules');
      await setDoc(rulesRef, updatedRulesData);
      
      // 상태 업데이트
      setRulesData(updatedRulesData);
      setActiveTab(Object.keys(updatedRulesData)[0]);
      
      alert('장이 삭제되었습니다.');
    } catch (err) {
      console.error('장 삭제 중 오류 발생:', err);
      alert('장 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Head>
          <title>Westerners - 회칙</title>
          <meta name="description" content="Westerners 모임의 회칙" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Header />

        {/* Hero Section */}
        <section className="pt-32 pb-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Westerners 회칙</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              서쪽모임의 원활한 운영을 위한 규칙과 규정을 안내합니다
            </p>
            {canEdit && (
              <div className="mt-8">
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="bg-white text-blue-800 hover:bg-blue-100 font-semibold py-2 px-6 rounded-full transition-all duration-300"
                >
                  {isEditMode ? '수정 모드 종료' : '회칙 수정하기'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Rules Content */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex flex-wrap border-b relative">
                {Object.values(rulesData)
                  .sort((a, b) => a.order - b.order)
                  .map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => setActiveTab(chapter.id)}
                    className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                      activeTab === chapter.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-blue-600'
                    }`}
                  >
                    제 {chapter.order} 장 {chapter.title}
                  </button>
                ))}
                {isEditMode && canEdit && (
                  <button
                    onClick={handleAddChapter}
                    className="px-4 py-2 ml-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 my-2"
                  >
                    + 새 장 추가
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-10 text-red-500">{error}</div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center space-x-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                          제 {rulesData[activeTab].order} 장
                        </h2>
                        {isEditMode && canEdit ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={rulesData[activeTab].title}
                              onChange={(e) => handleChapterTitleChange(activeTab, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleDeleteChapter(activeTab)}
                              className="text-red-600 hover:text-red-800 px-2 py-1"
                            >
                              장 삭제
                            </button>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-gray-800">
                            {rulesData[activeTab].title}
                          </span>
                        )}
                      </div>
                      {isEditMode && canEdit && (
                        <button
                          onClick={() => handleAddRule()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                          조항 추가
                        </button>
                      )}
                    </div>
                    
                    {rulesData[activeTab].rules.map((rule) => (
                      <div key={rule.id} className="mb-8 border-b pb-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                              제 {rule.chapter} 장 {rule.section} 조 {rule.title}
                            </h3>
                            <p className="text-gray-700 whitespace-pre-line">{rule.content}</p>
                          </div>
                          {isEditMode && canEdit && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditRule(rule)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 회칙 수정 모달 */}
        {isModalOpen && editingRule && (
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">회칙 {editingRule.id ? '수정' : '추가'}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">조 번호</label>
                  <input
                    type="text"
                    value={editingRule.section}
                    onChange={(e) => setEditingRule({...editingRule, section: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    value={editingRule.title}
                    onChange={(e) => setEditingRule({...editingRule, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 명칭, 구성, 회비 등"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                  <textarea
                    value={editingRule.content}
                    onChange={(e) => setEditingRule({...editingRule, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="회칙 내용을 입력하세요"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveRule}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </Modal>
        )}

        <Footer />

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