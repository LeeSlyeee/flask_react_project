from flask_sqlalchemy import SQLAlchemy

# SQLAlchemy 인스턴스 생성
# SQLAlchemy는 'ORM(Object Relational Mapping)' 라이브러리입니다.
# 쉽게 말해, 복잡한 SQL 쿼리문(SELECT, INSERT 등)을 몰라도
# 파이썬 클래스와 객체만으로 데이터베이스를 다룰 수 있게 해주는 도구입니다.
db = SQLAlchemy()

# ==============================================================================
# 1. 회원(Member) 모델 정의
# ==============================================================================
# 사용자의 계정 정보를 저장하는 테이블입니다.
# 로그인 아이디, 비밀번호, 프로필 사진 경로 등을 보관합니다.
class Member(db.Model):
    # __tablename__: 데이터베이스에 실제로 생성될 테이블의 이름입니다.
    __tablename__ = 'Member'
    
    # userKey: 사용자를 구분하는 고유 번호 (기본키, Primary Key)
    # autoincrement=True: 데이터를 넣을 때마다 번호가 1, 2, 3... 자동으로 증가합니다.
    userKey = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # userID: 사용자가 로그인할 때 사용하는 아이디
    # unique=True: 똑같은 아이디를 가진 사람이 2명일 수 없도록 막습니다 (중복 방지).
    # nullable=False: 이 칸은 비워둘 수 없습니다 (필수 입력).
    userID = db.Column(db.String(50), unique=True, nullable=False)
    
    # userPW: 사용자의 비밀번호
    # 보안을 위해 사용자가 입력한 비밀번호 그대로가 아니라, 암호화(해싱)된 문자열이 저장됩니다.
    userPW = db.Column(db.String(255), nullable=False)
    
    # profileImage: 프로필 사진 파일이 저장된 경로 (예: /static/uploads/image.jpg)
    # nullable=True: 프로필 사진은 없어도 가입이 가능하므로 빈 값을 허용합니다.
    profileImage = db.Column(db.String(255), nullable=True)

    # description: 프로필 소개글 (Bio)
    # nullable=True: 소개글은 비워둘 수 있습니다.
    description = db.Column(db.String(500), nullable=True)

    # to_dict: 파이썬 객체(Member)를 딕셔너리(JSON) 형태로 변환해주는 함수
    # 프론트엔드로 데이터를 보낼 때는 반드시 JSON 포맷이어야 하기 때문에 이 함수가 필요합니다.
    # 주의: userPW(비밀번호)는 보안상 절대 포함하지 않습니다.
    def to_dict(self):
        return {
            'userKey': self.userKey,
            'userID': self.userID,
            'profileImage': self.profileImage,
            'description': self.description or "" # None이면 빈 문자열 반환
        }

# ==============================================================================
# 2. 게시물(Post) 모델 정의
# ==============================================================================
# 사용자가 피드에 올리는 사진과 글을 저장하는 테이블입니다.
class Post(db.Model):
    __tablename__ = 'Post'
    
    # postKey: 게시물 고유 번호
    postKey = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # userKey: 이 글을 누가 썼는지 기록 (외래키, Foreign Key)
    # 'Member.userKey'를 참조하여, 회원이 삭제되면 관련 로직을 처리할 수 있게 연결고리를 만듭니다.
    userKey = db.Column(db.Integer, db.ForeignKey('Member.userKey'), nullable=False)
    
    # userID: 작성자의 아이디
    # 원래는 userKey만 있어도 누가 썼는지 알 수 있지만(조인),
    # 목록을 보여줄 때마다 매번 조인하면 느려질 수 있어서 편의상 아이디도 같이 저장해둡니다 (반정규화).
    userID = db.Column(db.String(50), nullable=False)
    
    # postingDate: 글을 작성한 시간
    # server_default=db.func.now(): 데이터를 넣을 때 시간을 안 주면, 현재 데이터베이스 시간으로 자동 저장합니다.
    postingDate = db.Column(db.DateTime, server_default=db.func.now())
    
    # photoSrc: 업로드한 사진의 경로
    photoSrc = db.Column(db.String(255))
    
    # content: 게시글 내용 (캡션)
    content = db.Column(db.Text)

    def to_dict(self):
        return {
            'postKey': self.postKey,
            'userKey': self.userKey,
            'userID': self.userID,
            # 날짜를 문자열로 변환할 때 '+09:00'을 붙여서 한국 시간(KST)임을 명시합니다.
            'postingDate': (self.postingDate.isoformat() + '+09:00') if self.postingDate else None,
            'photoSrc': self.photoSrc,
            'content': self.content
        }

# ==============================================================================
# 3. 댓글(Comment) 모델 정의
# ==============================================================================
# 게시물에 달린 댓글과 대댓글을 저장하는 테이블입니다.
class Comment(db.Model):
    __tablename__ = 'Comment'
    
    commentKey = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # postKey: 어떤 '게시물'에 달린 댓글인지 연결
    postKey = db.Column(db.Integer, db.ForeignKey('Post.postKey'), nullable=False)
    
    # userKey: 누가 쓴 댓글인지 연결
    userKey = db.Column(db.Integer, db.ForeignKey('Member.userKey'), nullable=False)
    
    # parentKey: '대댓글(답글)' 기능을 위한 핵심 컬럼
    # 이 댓글이 어떤 '부모 댓글'에 대한 답글인지를 저장합니다.
    # 만약 최상위 댓글(일반 댓글)이라면 이 값은 NULL(비어있음)이 됩니다.
    parentKey = db.Column(db.Integer, db.ForeignKey('Comment.commentKey'), nullable=True)
    
    userID = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    commentDate = db.Column(db.DateTime, server_default=db.func.now())

    # replies: 대댓글 관계 설정 (ORM 기능)
    # 특정 댓글(parent)을 가져올 때, 그 댓글에 달린 자식 댓글들(replies)을 쉽게 가져오기 위해 설정합니다.
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[commentKey]), lazy='dynamic')

    def to_dict(self):
        return {
            'commentKey': self.commentKey,
            'postKey': self.postKey,
            'userKey': self.userKey,
            'parentKey': self.parentKey,
            'userID': self.userID,
            'content': self.content,
            'date': (self.commentDate.isoformat() + '+09:00') if self.commentDate else None
        }

# ==============================================================================
# 4. 좋아요(Likes) 모델 정의
# ==============================================================================
# '누가(User)' '어떤 글(Post)'을 좋아했는지 저장하는 테이블입니다.
# 사용자와 게시물 사이의 다대다(N:M) 관계를 해소하기 위한 연결 테이블입니다.
class Likes(db.Model):
    __tablename__ = 'Likes'
    
    # 복합 기본키(Composite Primary Key) 전략을 사용합니다.
    # postKey와 userKey 두 개를 묶어서 기본키로 지정합니다.
    # 의미: "한 사용자가 같은 게시물에 좋아요를 두 번 누를 수 없다"는 제약사항을 DB 차원에서 강제합니다.
    postKey = db.Column(db.Integer, db.ForeignKey('Post.postKey'), primary_key=True, nullable=False)
    userKey = db.Column(db.Integer, db.ForeignKey('Member.userKey'), primary_key=True, nullable=False)
