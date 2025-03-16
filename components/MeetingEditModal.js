import { useState, useEffect } from 'react';
import Modal from './Modal';
import { updateNextMeeting } from '../lib/firestoreService';

export default function MeetingEditModal({ isOpen, onClose, currentMeeting, onUpdate }) {
  const [formData, setFormData] = useState({
    meetingNumber: 1,
    date: '',
    time: '',
    location: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 현재 정기모임 정보로 폼 초기화
  useEffect(() => {
    if (currentMeeting) {
      setFormData({
        meetingNumber: currentMeeting.meetingNumber || 1,
        date: currentMeeting.date || '',
        time: currentMeeting.time || '',
        location: currentMeeting.location || ''
      });
    }
  }, [currentMeeting]);

  // 입력 변경 처리
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 회차는 숫자만 입력 가능
    if (name === 'meetingNumber') {
      const numValue = parseInt(value) || 1;
      setFormData(prev => ({ ...prev, [name]: numValue }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 입력 검증
      if (!formData.date.trim()) {
        throw new Error('날짜를 입력해주세요.');
      }
      
      if (!formData.time.trim()) {
        throw new Error('시간을 입력해주세요.');
      }
      
      if (!formData.location.trim()) {
        throw new Error('장소를 입력해주세요.');
      }
      
      // Firestore에 정기모임 정보 업데이트
      await updateNextMeeting(formData);
      
      // 부모 컴포넌트에 업데이트 알림
      if (onUpdate) {
        onUpdate(formData);
      }
      
      // 모달 닫기
      onClose();
    } catch (err) {
      console.error('정기모임 정보 업데이트 중 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="정기모임 정보 수정">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="meetingNumber" className="block text-sm font-medium text-gray-700 mb-1">
            회차
          </label>
          <input
            type="number"
            id="meetingNumber"
            name="meetingNumber"
            value={formData.meetingNumber}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            날짜
          </label>
          <input
            type="text"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            placeholder="예: 2023년 12월 25일"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            시간
          </label>
          <input
            type="text"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            placeholder="예: 오후 7시"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            장소
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="예: 차이나타운 OO 레스토랑"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            disabled={isLoading}
          >
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
} 