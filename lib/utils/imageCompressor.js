/**
 * 이미지 압축 유틸리티
 * 
 * 이미지 파일을 압축하고 리사이징하는 기능을 제공합니다.
 * Firestore 문서 크기 제한(1MB)을 고려하여 이미지를 최적화합니다.
 */

/**
 * 이미지 파일을 압축하고 리사이징합니다.
 * @param {File} file - 압축할 이미지 파일
 * @param {Object} options - 압축 옵션
 * @param {Function} progressCallback - 진행 상황을 보고받을 콜백 함수
 * @returns {Promise<string>} - 압축된 이미지의 Base64 데이터 URL
 */
export const compressImage = (file, options = {}, progressCallback = () => {}) => {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.6,
    maxSize = 900000, // 900KB (Firestore 제한 1MB보다 작게)
    smallFileThreshold = 5 * 1024 * 1024 // 5MB
  } = options;
  
  return new Promise((resolve, reject) => {
    // 진행 상황 업데이트
    progressCallback(5);
    
    // 파일 크기에 따라 다른 처리 방식 적용
    const processLargeFile = file.size > smallFileThreshold;
    
    const reader = new FileReader();
    
    if (processLargeFile) {
      // 대용량 파일 처리 (모바일 환경 최적화)
      console.log('대용량 파일 처리 시작:', file.size, 'bytes');
      reader.readAsArrayBuffer(file);
      
      reader.onload = (e) => {
        try {
          progressCallback(15);
          
          // Blob 생성 및 URL 생성
          const blob = new Blob([e.target.result], { type: 'image/jpeg' });
          const blobUrl = URL.createObjectURL(blob);
          
          // 이미지 로드
          const img = new Image();
          
          img.onload = () => {
            try {
              progressCallback(30);
              
              // 이미지 크기 계산
              const { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
              
              // 캔버스 생성 및 이미지 그리기
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              
              // 이미지 압축
              let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
              progressCallback(40);
              
              // 크기 확인 및 추가 압축
              if (compressedDataUrl.length > maxSize) {
                compressedDataUrl = applyAdditionalCompression(canvas, img, maxSize);
                progressCallback(45);
              }
              
              // 메모리 정리
              URL.revokeObjectURL(blobUrl);
              
              console.log('압축 완료:', compressedDataUrl.length, 'bytes');
              progressCallback(50);
              resolve(compressedDataUrl);
            } catch (err) {
              console.error('이미지 압축 중 오류:', err);
              // 오류 발생 시 더 간단한 방식으로 시도
              try {
                const fallbackResult = createFallbackImage(img);
                URL.revokeObjectURL(blobUrl);
                resolve(fallbackResult);
              } catch (finalErr) {
                console.error('최종 압축 시도 실패:', finalErr);
                URL.revokeObjectURL(blobUrl);
                reject(finalErr);
              }
            }
          };
          
          img.onerror = (error) => {
            console.error('이미지 로드 중 오류:', error);
            URL.revokeObjectURL(blobUrl);
            reject(error);
          };
          
          img.src = blobUrl;
        } catch (err) {
          console.error('Blob 처리 중 오류:', err);
          reject(err);
        }
      };
    } else {
      // 일반 파일 처리
      console.log('일반 파일 처리 시작:', file.size, 'bytes');
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        progressCallback(20);
        
        const img = new Image();
        
        img.onload = () => {
          try {
            progressCallback(30);
            
            // 이미지 크기 계산
            const { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
            
            // 캔버스 생성 및 이미지 그리기
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // 이미지 압축
            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            progressCallback(40);
            
            console.log('원본 이미지 크기:', event.target.result.length, '압축 후 크기:', compressedDataUrl.length);
            
            // 크기 확인 및 추가 압축
            if (compressedDataUrl.length > maxSize) {
              compressedDataUrl = applyAdditionalCompression(canvas, img, maxSize);
              progressCallback(45);
            }
            
            progressCallback(50);
            resolve(compressedDataUrl);
          } catch (err) {
            console.error('이미지 처리 중 오류:', err);
            // 오류 발생 시 더 간단한 방식으로 시도
            try {
              const fallbackResult = createFallbackImage(img);
              resolve(fallbackResult);
            } catch (finalErr) {
              console.error('최종 압축 시도 실패:', finalErr);
              reject(finalErr);
            }
          }
        };
        
        img.onerror = (error) => {
          console.error('이미지 로드 중 오류:', error);
          reject(error);
        };
        
        img.src = event.target.result;
      };
    }
    
    reader.onerror = (error) => {
      console.error('파일 읽기 오류:', error);
      reject(error);
    };
  });
};

/**
 * 이미지 크기를 계산합니다.
 * @param {number} imgWidth - 원본 이미지 너비
 * @param {number} imgHeight - 원본 이미지 높이
 * @param {number} maxWidth - 최대 너비
 * @param {number} maxHeight - 최대 높이
 * @returns {Object} - 계산된 너비와 높이
 */
function calculateDimensions(imgWidth, imgHeight, maxWidth, maxHeight) {
  let width = imgWidth;
  let height = imgHeight;
  
  // 이미지 크기 조정
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round(height * (maxWidth / width));
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round(width * (maxHeight / height));
      height = maxHeight;
    }
  }
  
  return { width, height };
}

/**
 * 추가 압축을 적용합니다.
 * @param {HTMLCanvasElement} canvas - 캔버스 요소
 * @param {HTMLImageElement} img - 이미지 요소
 * @param {number} maxSize - 최대 크기 (바이트)
 * @returns {string} - 압축된 이미지의 Base64 데이터 URL
 */
function applyAdditionalCompression(canvas, img, maxSize) {
  console.warn('추가 압축 적용 중...');
  
  // 더 강한 압축 적용 (품질 40%)
  let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.4);
  
  // 여전히 크기가 크면 해상도도 줄임
  if (compressedDataUrl.length > maxSize) {
    const width = Math.round(canvas.width * 0.6);
    const height = Math.round(canvas.height * 0.6);
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    compressedDataUrl = canvas.toDataURL('image/jpeg', 0.4);
    console.log('해상도 축소 및 추가 압축 후 크기:', compressedDataUrl.length);
  } else {
    console.log('품질 축소 후 크기:', compressedDataUrl.length);
  }
  
  return compressedDataUrl;
}

/**
 * 최후의 수단으로 매우 작은 이미지를 생성합니다.
 * @param {HTMLImageElement} img - 이미지 요소
 * @returns {string} - 압축된 이미지의 Base64 데이터 URL
 */
function createFallbackImage(img) {
  console.warn('최후의 압축 방법 시도 중...');
  
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 600, 600);
  
  // 이미지를 중앙에 배치
  const size = Math.min(600, img.width, img.height);
  const offsetX = (600 - size) / 2;
  const offsetY = (600 - size) / 2;
  
  try {
    ctx.drawImage(img, offsetX, offsetY, size, size);
  } catch (e) {
    // 이미지 그리기 실패 시 빈 캔버스라도 반환
    console.error('이미지 그리기 실패:', e);
  }
  
  // 매우 낮은 품질로 압축
  return canvas.toDataURL('image/jpeg', 0.3);
} 