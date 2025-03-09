// 기존 Firebase 컬렉션 삭제 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase 구성
const firebaseConfig = {
  apiKey: "AIzaSyDwj2gCeTR8idcscEjm_BGugegR6JsnOSs",
  authDomain: "westerners-63a9d.firebaseapp.com",
  projectId: "westerners-63a9d",
  storageBucket: "westerners-63a9d.firebasestorage.app",
  messagingSenderId: "108795063660",
  appId: "1:108795063660:web:51bf88c36124bc8d7dd749"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 삭제할 컬렉션 이름
const collectionsToDelete = ['members', 'expenses'];

// 컬렉션 삭제 함수
const deleteCollections = async () => {
  try {
    console.log('기존 컬렉션 삭제 시작...');
    
    for (const collectionName of collectionsToDelete) {
      console.log(`'${collectionName}' 컬렉션 삭제 시작...`);
      
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      if (querySnapshot.empty) {
        console.log(`'${collectionName}' 컬렉션에 문서가 없습니다.`);
        continue;
      }
      
      for (const document of querySnapshot.docs) {
        await deleteDoc(doc(db, collectionName, document.id));
        console.log(`문서 ID: ${document.id} 삭제 완료`);
      }
      
      console.log(`'${collectionName}' 컬렉션의 모든 문서 삭제 완료!`);
    }
    
    console.log('모든 기존 컬렉션 삭제 완료!');
    console.log('참고: Firestore에서는 컬렉션 자체를 직접 삭제할 수 없으며, 모든 문서가 삭제되면 컬렉션도 자동으로 사라집니다.');
    
  } catch (error) {
    console.error('컬렉션 삭제 중 오류 발생:', error);
  }
};

// 사용자 확인
console.log('주의: 이 스크립트는 다음 컬렉션의 모든 문서를 영구적으로 삭제합니다:', collectionsToDelete.join(', '));
console.log('계속 진행하시려면 아무 키나 누르세요...');

// 키 입력 대기 후 실행
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', () => {
  process.stdin.setRawMode(false);
  process.stdin.pause();
  
  deleteCollections()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('오류 발생:', error);
      process.exit(1);
    });
}); 