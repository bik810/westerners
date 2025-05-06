# Westerners - 싱가포르 한국인 커뮤니티 웹사이트

## 프로젝트 개요
Westerners는 싱가포르에서 근무하는 한국인들의 친목 모임을 위한 웹사이트입니다. 회원들 간의 소통과 정보 공유를 원활하게 하기 위해 개발되었습니다.

## 주요 기능
- 회원 관리
  - 관리자 계정 생성 및 관리
  - 회원 정보 관리
  - 역할 기반 접근 제어 (관리자/총무/일반 회원)

- 모임 정보
  - 모임 소개 및 활동 내용 관리
  - 임원단 정보 관리
  - 회칙 관리

- 갤러리
  - 모임 활동 사진 업로드 및 관리
  - 이미지 최적화 및 압축

- 회비 관리
  - 회비 납부 내역 관리
  - 지출 내역 관리
  - 회계 보고서 생성

## 기술 스택
- Frontend: Next.js, React, Tailwind CSS
- Backend: Firebase (Authentication, Firestore, Storage)
- 배포: Vercel

## 개발 환경 설정
1. 저장소 클론
```bash
git clone https://github.com/bik810/westerners.git
cd westerners
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. 개발 서버 실행
```bash
npm run dev
```

## 배포
- 프로덕션 환경: Vercel을 통한 자동 배포
- 브랜치별 미리보기 배포 지원

## 보안
- Firebase Authentication을 통한 사용자 인증
- Firestore 보안 규칙을 통한 데이터 접근 제어
- 역할 기반 접근 제어 (RBAC) 구현

## 프로젝트 구조
```
westerners/
├── components/     # 재사용 가능한 컴포넌트
├── lib/           # 유틸리티 함수 및 Firebase 서비스
├── pages/         # 페이지 컴포넌트
├── public/        # 정적 파일
├── styles/        # 전역 스타일
└── scripts/       # 빌드 및 배포 스크립트
```

## 기여 방법
1. 이슈 생성 또는 기존 이슈 확인
2. 새로운 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성

## 라이선스
이 프로젝트는 MIT 라이선스를 따릅니다.
