# InstaClone 2 Project Documentation

## 1. Project Overview (무엇을 만들것인가?)

사이트에 회원가입을 통하여 서로 사진을 공유하고 마음에 드는 사진이 있는 경우 "좋아요" 클릭 및 댓글로 소통하며 호감을 표현하는 SNS 사이트.

## 2. Development Guidelines (작업시 꼭 지켜야할 사항)

- **TDD 사용**: 테스트 주도 개발 방법론 적용.
- **중복코드 제거**: 동일한 로직이 반복되지 않도록 작성.
- **설명 가능한 코드**: 코드를 통해 의도가 명확히 전달되도록 작성.
- **네이밍**: 의미가 명확한 변수명/함수명 사용.
- **Decoupling**: 관련 없는 것들은 상호 영향이 없도록 분리.
- **레이아웃**: 의미가 명확한 레이아웃 구성.
- **SRP (Single Responsibility Principle)**: 하나의 로직은 하나의 기능만 담당.

### Study Topics

- **React**: TypeScript, OOP 개념 습득, Hooks (옵션).
- **NextJS**: OOP 개념 강화.
- **TDD**: 설계 중심 코딩 개념 습득.
- **DB (MySQL)**: DB 기본기 학습.

---

## 3. Data Schema

### Member (회원)

| Field     | Type             | Description      |
| --------- | ---------------- | ---------------- |
| `userKey` | Number (INT)     | PK, 유저 고유 키 |
| `userID`  | String (VARCHAR) | 유저 아이디      |
| `userPW`  | String (VARCHAR) | 유저 비밀번호    |

### Post (게시글)

| Field         | Type             | Description             |
| ------------- | ---------------- | ----------------------- |
| `postKey`     | Number (INT)     | PK, 게시글 고유 키      |
| `userKey`     | Number (INT)     | FK, 작성자 키           |
| `userID`      | String           | 작성자 아이디           |
| `postingDate` | String/Date      | 게시 날짜 (Date Format) |
| `photoSrc`    | String (VARCHAR) | 사진 경로               |
| `content`     | String (VARCHAR) | 게시글 내용             |

### Profile (프로필)

| Field             | Type             | Description      |
| ----------------- | ---------------- | ---------------- |
| `userKey`         | Number (INT)     | PK, 유저 고유 키 |
| `profilePhotoSrc` | String (VARCHAR) | 프로필 사진 경로 |
| `profileContent`  | String (VARCHAR) | 프로필 소개글    |

### Comment (댓글)

| Field         | Type             | Description                            |
| ------------- | ---------------- | -------------------------------------- |
| `commentKey`  | Number (INT)     | PK, 댓글 고유 키                       |
| `postKey`     | Number (INT)     | FK, 게시글 키                          |
| `parentKey`   | Number (INT)     | 대댓글인 경우 부모 댓글 키 (Default 0) |
| `depth`       | Number (INT)     | 댓글 깊이                              |
| `userKey`     | Number (INT)     | FK, 작성자 키                          |
| `userID`      | String           | 작성자 아이디                          |
| `commentDate` | String/Date      | 댓글 작성 날짜                         |
| `content`     | String (VARCHAR) | 댓글 내용                              |

### Like (좋아요)

| Field          | Type           | Description                                                      |
| -------------- | -------------- | ---------------------------------------------------------------- |
| `postKey`      | Number (INT)   | 게시글 키                                                        |
| `userKey`      | Number (INT)   | 유저 키                                                          |
| `likeUserList` | String (Array) | 좋아요 누른 유저 리스트 (구조상 별도 테이블 매핑 또는 배열 저장) |

---

## 4. User Flows

### Sign Up (회원가입)

1.  **Start**: 회원정보 확인.
2.  **Duplicate Check**: 중복되는 계정이 있는지 확인.
    - 있음 -> 가입 불가.
    - 없음 -> 가입 진행.
3.  **Completion**: 회원가입 완료.

### Login (로그인)

1.  **Input**: 아이디/비밀번호 입력.
2.  **Validation**:
    - 아이디/비밀번호 조건 부합 여부 확인.
    - 계정 정보 일치 여부 확인 (DB 대조).
3.  **Result**:
    - 성공: 메인페이지로 이동.
    - 실패: 경고창 또는 재입력.

### Post Creation (게시글 작성)

1.  **Trigger**: "게시글을 작성하려하는가?" -> 업로드 버튼 클릭.
2.  **Page Move**: 업로드 페이지로 이동.
3.  **Photo**: 사진 업로드.
    - 형식 확인 (Valid Format?).
4.  **Content**: 게시글 내용 입력.
5.  **Submit**: 작성 완료 버튼 클릭 -> 메인페이지로 이동.

### Profile (프로필)

1.  **Access**: "프로필로 이동 하려하는가?" -> 프로필 버튼 클릭.
2.  **View**: 내 게시물만 노출되는 프로필 화면으로 이동.
3.  **Update (수정)**:
    - "프로필을 수정할 것인가?" -> 수정 버튼 클릭.
    - 수정할 프로필(사진/텍스트) 입력.
    - 적용 -> DB 업데이트 -> 프로필 화면 갱신.

### Logout (로그아웃)

1.  **Trigger**: 로그아웃 버튼 클릭.
2.  **Confirm**: "정말로 로그아웃을 할 것인가?" (Confirm 창).
3.  **Action**:
    - Yes -> 로그아웃 처리 -> 로그인 화면으로 이동.
    - No -> 취소.

### Like & Comment (좋아요 및 댓글)

- **Like**: 좋아요 클릭 -> 본인 아이디가 리스트에 존재하는지 확인 -> (존재하면 취소, 없으면 누적).
- **Comment**: 댓글 작성 -> 1글자 이상인지 확인 -> 등록.
- **Edit/Delete**: 본인이 작성한 게시글/댓글인지 확인 -> 수정 또는 삭제 (Confirm 창) -> 완료.
