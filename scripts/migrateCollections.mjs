// Firebase 컬렉션 이름 변경을 위한 데이터 마이그레이션 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

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

// 컬렉션 이름 매핑
const collectionMapping = [
  { oldName: 'members', newName: 'incomes' },
  { oldName: 'expenses', newName: 'expenditures' }
];

// 데이터 마이그레이션 함수
const migrateCollections = async () => {
  try {
    for (const mapping of collectionMapping) {
      console.log(`'${mapping.oldName}' 컬렉션을 '${mapping.newName}' 컬렉션으로 마이그레이션 시작...`);
      
      // 기존 컬렉션에서 모든 문서 가져오기
      const querySnapshot = await getDocs(collection(db, mapping.oldName));
      
      // 새 컬렉션에 문서 추가
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        await addDoc(collection(db, mapping.newName), data);
        console.log(`문서 ID: ${doc.id} 마이그레이션 완료`);
      }
      
      console.log(`'${mapping.oldName}' 컬렉션에서 '${mapping.newName}' 컬렉션으로 마이그레이션 완료!`);
    }
    
    console.log('모든 컬렉션 마이그레이션 완료!');
    
    // 주의: 기존 컬렉션 삭제는 선택 사항입니다.
    // 아래 코드의 주석을 해제하면 기존 컬렉션의 문서가 삭제됩니다.
    /*
    console.log('기존 컬렉션 삭제 시작...');
    for (const mapping of collectionMapping) {
      const querySnapshot = await getDocs(collection(db, mapping.oldName));
      for (const document of querySnapshot.docs) {
        await deleteDoc(doc(db, mapping.oldName, document.id));
        console.log(`기존 문서 ID: ${document.id} 삭제 완료`);
      }
      console.log(`'${mapping.oldName}' 컬렉션 삭제 완료!`);
    }
    */
    
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
};

// 스크립트 실행
migrateCollections(); 