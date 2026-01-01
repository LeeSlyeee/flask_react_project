# InstaClone 프로젝트 문서

## 1. 프로젝트 개요

InstaClone은 인스타그램의 핵심 기능을 모방한 소셜 미디어 웹 애플리케이션입니다. 사용자는 사진 공유, 게시물 작성, 댓글(대댓글 지원), 좋아요, 프로필 관리 등의 기능을 이용할 수 있습니다.

## 2. 기술 스택

### 프론트엔드 (Frontend)

- **프레임워크**: React (Vite)
- **스타일링**: Inline CSS (컴포넌트 범위 스타일)
- **HTTP 클라이언트**: Axios
- **라우팅**: React Router DOM

### 백엔드 (Backend)

- **프레임워크**: Flask (Python)
- **데이터베이스**: MariaDB
- **ORM**: SQLAlchemy
- **인증**: 비밀번호 해싱(PBKDF2)을 포함한 커스텀 세션/토큰 기반 인증
- **CORS 처리**: Flask-CORS

## 3. 주요 기능

### 인증 (Authentication)

- **회원가입**: 고유한 사용자 ID와 비밀번호로 계정 생성.
- **로그인/로그아웃**: 비밀번호 해싱을 통한 보안 로그인.
- **세션 유지**: 저장된 인증 상태를 사용하여 새로고침 시 자동 로그인.

### 게시물 (Posts)

- **게시물 작성**: 드래그 앤 드롭 또는 파일 선택을 통한 이미지 업로드. 캡션 추가 가능.
- **피드 보기**: 모든 사용자의 게시물을 최신순으로 보여주는 스크롤 가능한 메인 피드.
- **게시물 삭제**: 본인이 작성한 게시물 삭제 가능 (관련 댓글/좋아요도 함께 삭제됨).

### 상호작용 (Interactions)

- **좋아요**: 게시물에 좋아요 토글. 실시간 좋아요 수 업데이트.
- **댓글**:
  - 게시물에 댓글 작성.
  - **대댓글(답글)**: 특정 댓글에 대한 답글 작성 지원 (들여쓰기 뷰).
  - **댓글 삭제**: 본인이 작성한 댓글 삭제 가능.
  - **레이아웃**: 텍스트는 왼쪽 정렬, 삭제 버튼은 수직 중앙 정렬로 최적화됨.

### 프로필 (Profile)

- **프로필 보기**: 사용자의 게시물을 그리드 형태로 모아보기.
- **프로필 사진**: 프로필 아바타(사진) 업로드 및 변경.

### 유틸리티

- **시간대 처리**: 서버와 클라이언트 간 일관된 날짜 표시를 위해 한국 표준시(KST, UTC+9) 강제 적용.
- **사용자 ID 포맷팅**: 이메일 주소의 뒷부분(예: `@domain.com`)을 숨겨 아이디만 깔끔하게 표시.

## 4. 데이터베이스 스키마

### `Member` 테이블 (회원)

| 컬럼명         | 타입         | 설명                       |
| :------------- | :----------- | :------------------------- |
| `userKey`      | Integer (PK) | 자동 증가 내부 ID          |
| `userID`       | String(50)   | 고유 사용자 ID (이메일 등) |
| `userPW`       | String(255)  | 해싱된 비밀번호            |
| `profileImage` | String(255)  | 프로필 이미지 파일 경로    |

### `Post` 테이블 (게시물)

| 컬럼명        | 타입         | 설명                                |
| :------------ | :----------- | :---------------------------------- |
| `postKey`     | Integer (PK) | 자동 증가 게시물 ID                 |
| `userKey`     | Integer (FK) | Member 테이블 참조                  |
| `userID`      | String(50)   | 조회 성능을 위한 작성자 ID 비정규화 |
| `postingDate` | DateTime     | 작성 일시 (KST)                     |
| `photoSrc`    | String(255)  | 업로드된 게시물 이미지 경로         |
| `content`     | Text         | 게시물 내용 (캡션)                  |

### `Comment` 테이블 (댓글)

| 컬럼명        | 타입         | 설명                                              |
| :------------ | :----------- | :------------------------------------------------ |
| `commentKey`  | Integer (PK) | 자동 증가 댓글 ID                                 |
| `postKey`     | Integer (FK) | Post 테이블 참조                                  |
| `userKey`     | Integer (FK) | Member 테이블 참조 (작성자)                       |
| `parentKey`   | Integer (FK) | Comment 테이블 참조 (부모 댓글) - **대댓글 기능** |
| `userID`      | String(50)   | 작성자 ID                                         |
| `content`     | Text         | 댓글 내용                                         |
| `commentDate` | DateTime     | 작성 일시 (KST)                                   |

### `Likes` 테이블 (좋아요)

| 컬럼명    | 타입             | 설명                                  |
| :-------- | :--------------- | :------------------------------------ |
| `postKey` | Integer (PK, FK) | Post 테이블 참조                      |
| `userKey` | Integer (PK, FK) | Member 테이블 참조 (좋아요 누른 사람) |

## 5. API 엔드포인트

### 인증 및 사용자 (Auth & User)

- `POST /api/register`: 신규 회원 가입.
- `POST /api/login`: 사용자 로그인.
- `GET /api/auth/verify`: 사용자 세션 토큰 검증.
- `POST /api/profile/image`: 프로필 사진 업로드.

### 게시물 (Posts)

- `GET /api/posts`: 모든 게시물 조회 (`targetUserKey` 또는 `targetUserID`로 필터링 가능).
- `POST /api/posts`: 새 게시물 작성 (multipart/form-data).
- `DELETE /api/posts/<id>`: 특정 게시물 삭제.

### 상호작용 (Interactions)

- `POST /api/posts/<id>/likes`: 게시물 좋아요 토글.
- `POST /api/posts/<id>/comments`: 댓글 작성 (`parentKey` 포함 시 대댓글).
- `DELETE /api/comments/<id>`: 특정 댓글 삭제.
- `GET /api/health`: 서버 상태 확인.

## 6. 프로젝트 구조

```
/
├── backend/
│   ├── app.py              # 메인 Flask 애플리케이션 & API 라우트
│   ├── models.py           # 데이터베이스 모델 정의
│   ├── static/uploads/     # 업로드된 사용자 이미지 저장소
│   └── reset_db.py         # DB 스키마 초기화 유틸리티
├── frontend/
│   ├── src/
│   │   ├── components/     # 재사용 가능한 UI 컴포넌트 (PostCard, Header 등)
│   │   ├── pages/          # 페이지 뷰 (Feed, Login, Profile)
│   │   └── App.jsx         # 메인 React 컴포넌트 & 라우팅
└── ...
```
