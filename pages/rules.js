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

  const [editContent, setEditContent] = useState('');

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
          
          // 전체 내용을 텍스트로 변환
          const fullText = Object.values(convertedData)
            .sort((a, b) => a.order - b.order)
            .map(chapter => {
              const rulesText = chapter.rules
                .map(rule => `제 ${rule.section}조 ${rule.title}\n${rule.content}`)
                .join('\n\n');
              return `제 ${chapter.order}장 ${chapter.title}\n\n${rulesText}`;
            })
            .join('\n\n\n');
          setEditContent(fullText);
        } else {
          // 기본 규칙 설정
          const defaultRules = {
            general: {
              id: 'general',
              order: 1,
              title: '단체 정의',
              rules: [
                {
                  id: 'general1',
                  chapter: '1',
                  section: '1',
                  title: '명칭',
                  content: '본 단체는 "웨스터너스"라 칭한다.'
                },
                {
                  id: 'general2',
                  chapter: '1',
                  section: '2',
                  title: '목적',
                  content: '본 단체는 회원들의 친목과 정보 교환을 목적으로 한다.'
                }
              ]
            },
            members: {
              id: 'members',
              order: 2,
              title: '회원',
              rules: [
                {
                  id: 'members1',
                  chapter: '2',
                  section: '1',
                  title: '회원 자격',
                  content: '회원은 본 단체의 목적에 동의하는 자로 한다.'
                }
              ]
            },
            finance: {
              id: 'finance',
              order: 3,
              title: '재정',
              rules: [
                {
                  id: 'finance1',
                  chapter: '3',
                  section: '1',
                  title: '회비',
                  content: '회비는 월 1회 정기 모임 시 납부한다.'
                }
              ]
            },
            regular: {
              id: 'regular',
              order: 4,
              title: '정기 모임',
              rules: [
                {
                  id: 'regular1',
                  chapter: '4',
                  section: '1',
                  title: '모임 일시',
                  content: '정기 모임은 매주 수요일 저녁에 개최한다.'
                }
              ]
            },
            safety: {
              id: 'safety',
              order: 5,
              title: '안전',
              rules: [
                {
                  id: 'safety1',
                  chapter: '5',
                  section: '1',
                  title: '안전 책임',
                  content: '모든 회원은 자신의 안전에 대한 책임을 진다.'
                }
              ]
            }
          };
          
          await setDoc(rulesRef, defaultRules);
          setRulesData(defaultRules);
          
          // 기본 내용을 텍스트로 변환
          const defaultText = Object.values(defaultRules)
            .sort((a, b) => a.order - b.order)
            .map(chapter => {
              const rulesText = chapter.rules
                .map(rule => `제 ${rule.section}조 ${rule.title}\n${rule.content}`)
                .join('\n\n');
              return `제 ${chapter.order}장 ${chapter.title}\n\n${rulesText}`;
            })
            .join('\n\n\n');
          setEditContent(defaultText);
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
  const handleSaveRules = async () => {
    if (!canEdit) return;
    
    try {
      // 텍스트를 파싱하여 구조화된 데이터로 변환
      const chapters = editContent.split('\n\n\n').map(chapterText => {
        const [chapterHeader, ...rulesText] = chapterText.split('\n\n');
        const [order, title] = chapterHeader.split(' ').slice(1);
        const id = `chapter_${order}`;
        
        const rules = rulesText.map(ruleText => {
          const [ruleHeader, content] = ruleText.split('\n');
          const [section, title] = ruleHeader.split(' ').slice(1);
          return {
            id: `${id}_${section}`,
            chapter: order,
            section,
            title,
            content
          };
        });

        return {
          id,
          order: parseInt(order),
          title,
          rules
        };
      });

      // Firestore에 저장
      const rulesRef = doc(db, 'settings', 'rules');
      const rulesData = chapters.reduce((acc, chapter) => {
        acc[chapter.id] = chapter;
        return acc;
      }, {});
      await setDoc(rulesRef, rulesData);
      
      // 상태 업데이트
      setRulesData(rulesData);
      setIsEditMode(false);
      
      alert('회칙이 저장되었습니다.');
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">회칙</h1>
            <p className="text-lg text-gray-600">웨스터너스의 회칙입니다.</p>
          </div>

          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-6">
              {isEditMode && canEdit ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">회칙 수정</h2>
                    <div className="space-x-2">
                      <button
                        onClick={() => setIsEditMode(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveRules}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">
                      • 장과 조항을 자유롭게 추가/수정/삭제할 수 있습니다.<br />
                      • 각 장은 "제 X장 제목" 형식으로 작성해주세요.<br />
                      • 각 조항은 "제 X조 제목" 형식으로 작성해주세요.<br />
                      • 장과 장 사이, 조항과 조항 사이는 빈 줄로 구분해주세요.
                    </p>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-[600px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder="회칙 내용을 입력하세요..."
                  />
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-end mb-4">
                    {canEdit && (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                      >
                        회칙 수정하기
                      </button>
                    )}
                  </div>
                  {Object.values(rulesData)
                    .sort((a, b) => a.order - b.order)
                    .map((chapter) => (
                      <div key={chapter.id} className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                          제 {chapter.order}장 {chapter.title}
                        </h2>
                        <div className="space-y-6">
                          {chapter.rules.map((rule) => (
                            <div key={rule.id} className="space-y-2">
                              <h3 className="text-xl font-semibold text-gray-700">
                                제 {rule.section}조 {rule.title}
                              </h3>
                              <p className="text-gray-600 whitespace-pre-line">{rule.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 