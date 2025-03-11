import Head from 'next/head';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';

export default function Rules() {
  const [activeTab, setActiveTab] = useState('general');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [rulesData, setRulesData] = useState({
    general: [],
    members: [],
    finance: [],
    regular: [],
    safety: []
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
          setRulesData(rulesSnapshot.data());
        } else {
          // 초기 데이터가 없는 경우 기본 데이터 설정
          const defaultRules = {
            general: [
              { id: 'g1', chapter: '1', section: '1', title: '명칭', content: '모임 명칭은 \'Westerners (한글명: 서쪽모임)\'으로 한다.' }
            ],
            members: [
              { id: 'm1', chapter: '2', section: '1', title: '구성', content: '모임은 회장 1명과 총무 1명의 임원단과 일반 회원들로 구성한다.' },
              { id: 'm2', chapter: '2', section: '2', title: '임기', content: '회장의 임기는 6개월이며, 정기 모임 시 회원들의 투표를 통해 다수결의 원칙으로 선출한다.' },
              { id: 'm3', chapter: '2', section: '3', title: '역할', content: '총무는 선출된 회장이 지정하며, 임기는 회장과 동일하다.' },
              { id: 'm4', chapter: '2', section: '4', title: '책임', content: '총무는 모임 회비를 관리하며, 매월 회비 정산을 책임진다.' },
              { id: 'm5', chapter: '2', section: '5', title: '가입', content: '신규 회원은 전원 만장일치 시에만 가입이 가능하다.' }
            ],
            finance: [
              { id: 'f1', chapter: '3', section: '1', title: '회비', content: '정기 회비는 임원단은 월 SGD 40, 일반 회원은 월 SGD 50으로 정한다.' },
              { id: 'f2', chapter: '3', section: '2', title: '납부', content: '정기 회비는 매월 21일에 총무에게 납부한다.' }
            ],
            regular: [
              { id: 'r1', chapter: '4', section: '1', title: '주기', content: '정기 모임은 2달 간격으로 진행한다.' },
              { id: 'r2', chapter: '4', section: '2', title: '장소', content: '정기 모임 장소는 회장이 결정한다.' },
              { id: 'r3', chapter: '4', section: '3', title: '주종', content: '정기 모임 시 주종은 매 모임 다른 주종으로 선택한다.' },
              { id: 'r4', chapter: '4', section: '4', title: '기념', content: '정기 모임 시 총무는 기념사진을 촬영하여 장부에 보관한다.' },
              { id: 'r5', chapter: '4', section: '5', title: '손님', content: '정기모임 시 자유롭게 손님 초대가 가능하며, 손님은 정기모임 비용의 1/n을 납부한다.' }
            ],
            safety: [
              { id: 's1', chapter: '5', section: '1', title: '안전', content: '정기 모임 시, 모임 규정에 포함될 안전 관련 의결을 진행한다.' },
              { id: 's2', chapter: '5', section: '2', title: '상정', content: '안건은 회원 누구나 자유롭게 상정할 수 있으며, 전체 유효 표의 과반수 찬성 시 규정에 추가된다.' },
              { id: 's3', chapter: '5', section: '3', title: '권한', content: '안건 의결 시, 회장은 2표의 권한이 있으며, 그 외 회원은 1표의 권한을 갖는다.' }
            ]
          };
          
          // Firestore에 기본 데이터 저장
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

  // 회칙 수정 모달 열기
  const handleEditRule = (rule) => {
    setEditingRule({ ...rule });
    setIsModalOpen(true);
  };

  // 회칙 저장
  const handleSaveRule = async () => {
    try {
      if (!editingRule) return;
      
      // 새 회칙 추가인 경우
      if (!rulesData[activeTab].find(rule => rule.id === editingRule.id)) {
        // 전체 규칙 데이터 업데이트
        const updatedRulesData = {
          ...rulesData,
          [activeTab]: [...rulesData[activeTab], editingRule]
        };
        
        // Firestore에 저장
        const rulesRef = doc(db, 'settings', 'rules');
        await setDoc(rulesRef, updatedRulesData);
        
        // 상태 업데이트
        setRulesData(updatedRulesData);
        setIsModalOpen(false);
        setEditingRule(null);
        
        alert('새 회칙이 성공적으로 추가되었습니다.');
        return;
      }
      
      // 기존 회칙 수정인 경우
      const updatedRules = rulesData[activeTab].map(rule => 
        rule.id === editingRule.id ? editingRule : rule
      );
      
      // 전체 규칙 데이터 업데이트
      const updatedRulesData = {
        ...rulesData,
        [activeTab]: updatedRules
      };
      
      // Firestore에 저장
      const rulesRef = doc(db, 'settings', 'rules');
      await setDoc(rulesRef, updatedRulesData);
      
      // 상태 업데이트
      setRulesData(updatedRulesData);
      setIsModalOpen(false);
      setEditingRule(null);
      
      alert('회칙이 성공적으로 수정되었습니다.');
    } catch (err) {
      console.error('회칙 저장 중 오류 발생:', err);
      alert('회칙 저장 중 오류가 발생했습니다.');
    }
  };

  // 회칙 추가
  const handleAddRule = () => {
    const newRule = {
      id: `${activeTab[0]}${rulesData[activeTab].length + 1}`,
      chapter: activeTab === 'general' ? '1' : 
               activeTab === 'members' ? '2' : 
               activeTab === 'finance' ? '3' : 
               activeTab === 'regular' ? '4' : '5',
      section: `${rulesData[activeTab].length + 1}`,
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
      // 현재 탭의 규칙 배열에서 해당 규칙 제거
      const updatedRules = rulesData[activeTab].filter(rule => rule.id !== ruleId);
      
      // 섹션 번호 재정렬
      const reorderedRules = updatedRules.map((rule, index) => ({
        ...rule,
        section: `${index + 1}`
      }));
      
      // 전체 규칙 데이터 업데이트
      const updatedRulesData = {
        ...rulesData,
        [activeTab]: reorderedRules
      };
      
      // Firestore에 저장
      const rulesRef = doc(db, 'settings', 'rules');
      await setDoc(rulesRef, updatedRulesData);
      
      // 상태 업데이트
      setRulesData(updatedRulesData);
      
      alert('회칙이 성공적으로 삭제되었습니다.');
    } catch (err) {
      console.error('회칙 삭제 중 오류 발생:', err);
      alert('회칙 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
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
          <div className="mt-8">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className="bg-white text-blue-800 hover:bg-blue-100 font-semibold py-2 px-6 rounded-full transition-all duration-300"
            >
              {isEditMode ? '수정 모드 종료' : '회칙 수정하기'}
            </button>
          </div>
        </div>
      </section>

      {/* Rules Content */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex flex-wrap border-b">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'general'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                제 1 장 단체 정의
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'members'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                제 2 장 회원
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'finance'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                제 3 장 회비
              </button>
              <button
                onClick={() => setActiveTab('regular')}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'regular'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                제 4 장 정기 모임
              </button>
              <button
                onClick={() => setActiveTab('safety')}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'safety'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                제 5 장 안건
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">{error}</div>
              ) : (
                <>
                  {/* 회칙 추가 버튼 */}
                  {isEditMode && (
                    <div className="mb-8 flex justify-end">
                      <button
                        onClick={handleAddRule}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        새 회칙 추가
                      </button>
                    </div>
                  )}

                  {/* 회칙 목록 */}
                  <div className="space-y-8 animate-fadeIn">
                    {rulesData[activeTab].map((rule) => (
                      <div key={rule.id} className="border-l-4 border-blue-600 pl-6 relative">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">
                          제 {rule.section} 조 ({rule.title})
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {rule.content}
                        </p>
                        
                        {/* 수정 및 삭제 버튼 */}
                        {isEditMode && (
                          <div className="absolute top-0 right-0 flex space-x-2">
                            <button
                              onClick={() => handleEditRule(rule)}
                              className="text-blue-600 hover:text-blue-800"
                              title="수정"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-600 hover:text-red-800"
                              title="삭제"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
  );
} 