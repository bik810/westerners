import Head from 'next/head';
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../lib/authContext';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function RulesFull() {
  const [rulesData, setRulesData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userProfile } = useAuth();
  
  // 권한 확인 함수
  const canEdit = userProfile && (userProfile.role === 'admin' || userProfile.role === 'treasurer');

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setIsLoading(true);
        const rulesRef = doc(db, 'settings', 'rules');
        const rulesSnapshot = await getDoc(rulesRef);
        
        if (rulesSnapshot.exists()) {
          const data = rulesSnapshot.data();
          setRulesData(data);
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <Head>
          <title>Westerners - 회칙 전문</title>
          <meta name="description" content="Westerners 모임의 회칙 전문" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Westerners 회칙</h1>
            <p className="text-lg text-gray-600">서쪽모임의 원활한 운영을 위한 규칙과 규정을 안내합니다</p>
          </div>

          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-8">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-center py-10 text-red-500">{error}</div>
              ) : (
                <div className="prose prose-lg max-w-none">
                  {Object.values(rulesData)
                    .sort((a, b) => a.order - b.order)
                    .map((chapter) => (
                      <div key={chapter.id} className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                          제 {chapter.order}장 {chapter.title}
                        </h2>
                        <div className="space-y-8">
                          {chapter.rules.map((rule) => (
                            <div key={rule.id}>
                              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                제 {rule.section}조 {rule.title}
                              </h3>
                              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                {rule.content}
                              </p>
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