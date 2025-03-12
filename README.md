# Westerners 모임 웹사이트

싱가포르 Westerners 모임을 위한 웹사이트입니다. 회원 관리, 회비 관리, 갤러리 기능을 제공합니다.

## 기능

- 회원 관리: 관리자가 회원을 추가, 수정, 삭제할 수 있습니다.
- 회비 관리: 총무와 관리자가 회비 수입과 지출을 관리할 수 있습니다.
- 갤러리: 회원들이 모임 사진을 공유할 수 있습니다.
- 사용자 권한: 관리자, 총무, 일반회원 권한에 따라 접근 가능한 기능이 다릅니다.

## 시작하기

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 개발 서버 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 웹사이트를 확인할 수 있습니다.

### 관리자 계정 초기화

처음 시작할 때 관리자 계정을 생성해야 합니다. 두 가지 방법이 있습니다:

#### 1. 스크립트를 사용하여 생성 (배포 환경에서 권장)

```bash
npm run init-admin
```

이 명령어는 다음 정보로 관리자 계정을 생성합니다:
- 사용자 ID: bik810
- 비밀번호: 1qaz2wsx

#### 2. Firebase 콘솔에서 직접 생성

1. [Firebase 콘솔](https://console.firebase.google.com/)에 로그인합니다.
2. 프로젝트를 선택합니다.
3. 왼쪽 메뉴에서 "Authentication"을 클릭합니다.
4. "사용자" 탭에서 "사용자 추가" 버튼을 클릭합니다.
5. 이메일에 `bik810@westerners.com`, 비밀번호에 `1qaz2wsx`를 입력하고 사용자를 생성합니다.
6. Firestore 데이터베이스에서 "users" 컬렉션에 다음 정보로 문서를 추가합니다:
   - 문서 ID: 생성된 사용자의 UID
   - 필드:
     - userId: "bik810"
     - email: "bik810@westerners.com"
     - name: "관리자"
     - role: "admin"
     - createdAt: 현재 날짜 및 시간
     - isFirstLogin: true

첫 로그인 시 비밀번호를 변경하도록 안내됩니다.

## 배포하기

### Vercel에 배포

1. [Vercel](https://vercel.com)에 가입하고 GitHub 저장소를 연결합니다.
2. 환경 변수를 Vercel 프로젝트 설정에 추가합니다.
3. 배포 후 관리자 계정을 초기화합니다:

```bash
vercel env pull .env.local  # 환경 변수 가져오기
npm run init-admin          # 관리자 계정 초기화
```

### Firebase 설정

1. Firebase 콘솔에서 프로젝트를 선택합니다.
2. Authentication > Sign-in method에서 이메일/비밀번호 로그인을 활성화합니다.
3. Authentication > Settings > Authorized domains에서 배포 도메인을 추가합니다.
   - 로컬 개발 시 `localhost`를 추가해야 합니다.
   - 배포 시 실제 도메인(예: `your-app.vercel.app`)을 추가해야 합니다.

### 다른 호스팅 서비스에 배포

1. 프로젝트를 빌드합니다:

```bash
npm run build
```

2. 빌드된 파일을 호스팅 서비스에 업로드합니다.
3. 환경 변수를 호스팅 서비스에 설정합니다.
4. 관리자 계정을 초기화합니다.

## 사용자 권한

- **관리자(admin)**: 모든 기능에 접근 가능, 회원 관리 가능
- **총무(treasurer)**: 회비 관리, 갤러리 접근 가능
- **일반회원(member)**: 갤러리 접근 가능
- **비로그인 사용자**: 홈페이지와 회칙만 볼 수 있음

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
