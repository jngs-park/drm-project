# DRM Project

PDF 문서를 암호화하여 보관하고, 인증된 사용자에게만 워터마크를 입혀 웹에서 열람시키는 **웹 기반 DRM(문서 보안) 뷰어** 예제입니다.

## 주요 기능

- **문서 암호화**: 원본 PDF를 AES로 암호화하여 `.locked` 파일로 보관
- **사용자 인증**: 아이디/비밀번호 검증 후에만 문서 데이터를 복호화하여 전달
- **서버 측 복호화**: 비밀키는 서버에만 존재하며, 클라이언트로 평문 키가 노출되지 않음
- **동적 워터마크**: 열람자 이름·IP·열람 일시를 PDF 위에 실시간으로 그려 무단 유출 추적
- **기본적인 유출 방지**: 우클릭(컨텍스트 메뉴) 및 인쇄(Ctrl/⌘+P) 차단

## 기술 스택

- **백엔드**: Node.js, [Express](https://expressjs.com/) 5
- **암호화**: [crypto-js](https://github.com/brix/crypto-js) (AES)
- **프런트엔드**: Vanilla JS, [PDF.js](https://mozilla.github.io/pdf.js/) (CDN)

## 프로젝트 구조

```
drm-project/
├── server.js      # Express 서버 — 인증 및 문서 복호화 API
├── encrypt.js     # 원본 PDF → 암호화(.locked) 변환 스크립트
├── index.html     # 로그인 화면 + PDF 뷰어
├── app.js         # 프런트엔드 — 인증 요청, PDF 렌더링, 워터마크
├── style.css      # 스타일
├── package.json
└── (sample.pdf / sample.locked — gitignore 처리, 로컬에서 생성)
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 문서 암호화

원본 PDF를 `sample.pdf` 라는 이름으로 프로젝트 루트에 둔 뒤:

```bash
node encrypt.js
```

`sample.locked` 암호화 파일이 생성됩니다.

### 3. 서버 실행

```bash
node server.js
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

### 테스트 계정

| 아이디 | 비밀번호 | 이름 |
|--------|----------|------|
| user1  | 123      | 김철수 |
| user2  | 456      | 이영희 |
| admin  | admin    | 관리자 |

## ⚠️ 보안 주의

이 프로젝트는 학습/데모 목적입니다. 실제 서비스에 그대로 사용하지 마세요.

- 비밀키(`my-super-secret-key`)와 계정 정보가 소스에 하드코딩되어 있습니다 → 환경 변수와 실제 DB로 분리 필요
- 비밀번호가 평문으로 저장·비교됩니다 → 해싱(bcrypt 등) 필요
- 우클릭/인쇄 차단, 워터마크는 우회 가능한 **억제책**이며 완전한 보호 수단이 아닙니다

## 라이선스

ISC
