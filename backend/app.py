from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import db, Member, Post, Comment, Likes
from dotenv import load_dotenv
import os
import datetime

# .env 파일 로드: DB 비밀번호 같은 중요한 정보는 코드에 직접 쓰지 않고 .env 파일에 숨겨둡니다.
load_dotenv()

# ==============================================================================
# Flask 앱 설정 및 초기화
# ==============================================================================
app = Flask(__name__)

# CORS (Cross-Origin Resource Sharing) 설정
# 프론트엔드(React, port 5173)와 백엔드(Flask, port 5000)는 포트가 다르기 때문에
# 브라우저가 보안상 요청을 막습니다. 이를 허용해주기 위해 CORS 설정을 합니다.
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, supports_credentials=True)

# 데이터베이스 연결 정보 설정
# .env 파일에서 'DATABASE_URI'를 가져와서 설정합니다.
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # 불필요한 이벤트 추적 끄기 (성능 최적화)

# 파일 업로드 경로 설정
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# 만약 업로드 폴더가 없으면, 서버 시작할 때 자동으로 만들어줍니다.
os.makedirs(os.path.join(app.root_path, UPLOAD_FOLDER), exist_ok=True)

# DB 객체와 Flask 앱 연결 (초기화)
db.init_app(app)

# ==============================================================================
# API 라우트 (경로) 정의
# ==============================================================================

# 1. 헬스 체크 (Health Check)
# 서버가 살아있는지, DB 연결은 잘 되는지 확인하는 가장 기초적인 API입니다.
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # DB에 쿼리를 한번 날려봐서 에러가 안 나면 연결 성공으로 간주합니다.
        member_count = db.session.query(Member).count()
        return jsonify({
            "status": "success",
            "message": "Connected to MariaDB!",
            "member_count": member_count
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# 2. 회원가입 (Register)
@app.route('/api/register', methods=['POST'])
def register():
    # 프론트엔드가 JSON 형태로 보낸 데이터 받기
    data = request.get_json()
    user_id = data.get('userID')
    user_pw = data.get('userPW')

    # 유효성 검사: 아이디나 비번이 비어있으면 안 됨
    if not user_id or not user_pw:
        return jsonify({"message": "아이디와 비밀번호를 입력해주세요."}), 400

    # 중복 아이디 검사
    existing_user = Member.query.filter_by(userID=user_id).first()
    if existing_user:
        return jsonify({"message": "이미 존재하는 사용자 ID입니다."}), 409

    try:
        # 비밀번호 암호화 (Hashing)
        # 사용자의 비밀번호는 DB 관리자도 볼 수 없도록 알 수 없는 문자열로 변환(해싱)해서 저장해야 합니다.
        hashed_pw = generate_password_hash(user_pw, method='pbkdf2:sha256')
        
        # 새 멤버 객체 생성 및 저장
        new_member = Member(userID=user_id, userPW=hashed_pw)
        db.session.add(new_member)
        db.session.commit() # commit을 해야 실제 DB에 반영됩니다.
        
        return jsonify({"message": "회원가입이 완료되었습니다."}), 201
    except Exception as e:
        db.session.rollback() # 에러 나면 작업 취소 (롤백)
        return jsonify({"message": str(e)}), 500

# 3. 로그인 (Login)
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user_id = data.get('userID')
    user_pw = data.get('userPW')

    if not user_id or not user_pw:
        return jsonify({"message": "아이디와 비밀번호를 입력해주세요."}), 400

    # 1단계: 아이디로 사용자 찾기
    member = Member.query.filter_by(userID=user_id).first()
    
    print(f"Login attempt: userID={user_id}, Found member={member}") # 디버깅용 로그
    
    if member:
        # 2단계: 비밀번호 확인
        # DB에 있는 암호화된 비밀번호와, 사용자가 입력한 비밀번호가 일치하는지 검사
        is_pw_correct = check_password_hash(member.userPW, user_pw)
        print(f"Password check result: {is_pw_correct}")
        
        if is_pw_correct:
             # 로그인 성공 시 사용자 정보를 프론트엔드에 돌려줍니다 (to_dict 사용).
             return jsonify({
                "message": "로그인 성공",
                "user": member.to_dict()
            }), 200

    # 아이디가 없거나 비밀번호가 틀린 경우
    return jsonify({"message": "아이디 또는 비밀번호가 잘못되었습니다."}), 401

# 4. 사용자 세션 검증
# 프론트엔드가 '새로고침' 했을 때, 이 사용자가 유효한 사용자인지 DB에서 다시 확인합니다.
@app.route('/api/auth/verify', methods=['GET'])
def verify_user():
    user_key = request.args.get('userKey')
    if not user_key:
        return jsonify({"message": "No userKey provided"}), 400
    
    member = Member.query.get(user_key)
    if not member:
        return jsonify({"message": "User not found"}), 404
        
    return jsonify({
        "message": "Valid user",
        "user": member.to_dict()
    }), 200

# 5. 프로필 이미지 업로드
@app.route('/api/profile/image', methods=['POST'])
def upload_profile_image():
    # 'image'라는 이름으로 파일이 왔는지 확인
    if 'image' not in request.files:
        return jsonify({"message": "이미지가 없습니다."}), 400
    
    file = request.files['image']
    user_key = request.form.get('userKey')

    if not user_key:
         return jsonify({"message": "사용자 정보가 필요합니다."}), 400

    if file:
        # secure_filename: 파일명에 해킹 스크립트나 이상한 경로(../)가 섞여있지 않게 안전하게 만듭니다.
        # 파일명 중복 방지를 위해 현재시간(timestamp)을 파일명 앞에 붙입니다.
        filename = secure_filename(f"profile_{user_key}_{datetime.datetime.now().timestamp()}_{file.filename}")
        
        # 파일 저장
        save_path = os.path.join(app.root_path, app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        
        # DB에 이미지 경로 업데이트
        photo_src = f"/static/uploads/{filename}"
        member = Member.query.get(user_key)
        if member:
            member.profileImage = photo_src
            db.session.commit()
            return jsonify({"message": "프로필 사진이 업데이트되었습니다.", "profileImage": photo_src}), 200
        else:
            return jsonify({"message": "사용자를 찾을 수 없습니다."}), 404
        
    return jsonify({"message": "업로드 실패"}), 500

# 5-2. 프로필 정보(소개글) 수정
@app.route('/api/profile/update', methods=['POST'])
def update_profile():
    data = request.get_json()
    user_key = data.get('userKey')
    description = data.get('description')

    if not user_key:
        return jsonify({"message": "User info required"}), 400
    
    try:
        member = Member.query.get(user_key)
        if not member:
            return jsonify({"message": "User not found"}), 404
        
        # 소개글 업데이트
        member.description = description
        db.session.commit()
        
        return jsonify({
            "message": "Profile updated",
            "user": member.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

# 6. 게시물 관리 (조회 및 작성)
@app.route('/api/posts', methods=['GET', 'POST'])
def handle_posts():
    # [GET] 게시물 목록 가져오기
    if request.method == 'GET':
        target_user_key = request.args.get('targetUserKey')
        target_user_id = request.args.get('targetUserID')
        
        query = Post.query
        # 특정 유저의 글만 보고 싶은 경우 (프로필 페이지)
        if target_user_key:
            # 유저의 고유번호(Key)가 있다면 가장 정확하므로 바로 검색합니다.
            query = query.filter_by(userKey=target_user_key)
        elif target_user_id:
            # 프로필 페이지 URL에 '짧은 아이디'(예: user)만 있어서 이메일 뒷부분(@domain.com)이 없는 경우를 대비합니다.
            
            target_member = None
            if '@' in target_user_id:
                 # 1. URL에 이미 이메일 형식(@)이 포함되어 있다면 정확한 아이디로 바로 검색
                 target_member = Member.query.filter_by(userID=target_user_id).first()
            else:
                 # 2. 이메일 형식이 아니라면, 해당 아이디로 시작하는 이메일을 찾습니다 (LIKE 검색).
                 # 예: 'kiking'으로 검색하면 'kiking@example.com'을 찾습니다.
                 target_member = Member.query.filter(Member.userID.like(f"{target_user_id}@%")).first()
                 
                 # 3. 혹시나 아이디 자체가 이메일 형식이 아닐 수도 있으니, 한 번 더 정확한 일치 여부를 확인합니다.
                 if not target_member:
                     target_member = Member.query.filter_by(userID=target_user_id).first()
            
            # 찾은 멤버가 있다면 그 멤버의 고유번호(userKey)로 게시물을 필터링합니다.
            # (Post 테이블의 userID 컬럼은 문자열이라 불일치할 수 있으므로, userKey가 훨씬 안전합니다.)
            if target_member:
                query = query.filter_by(userKey=target_member.userKey)
            else:
                # 해당 아이디를 가진 유저가 아예 없으면 빈 리스트를 반환합니다.
                return jsonify([]), 200
            
        # 최신 글이 위에 오도록 정렬 (desc: 내림차순, postingDate 기준)
        posts = query.order_by(Post.postingDate.desc()).all()
        
        result = []
        for post in posts:
            post_data = post.to_dict()
            
            # 추가 정보 조회: 좋아요 수
            like_count = Likes.query.filter_by(postKey=post.postKey).count()
            post_data['like_count'] = like_count

            # 추가 정보 조회: 작성자 프로필 사진
            author = Member.query.get(post.userKey)
            post_data['profileImage'] = author.profileImage if author else None
            
            # 추가 정보 조회: 댓글 목록
            comments = Comment.query.filter_by(postKey=post.postKey).order_by(Comment.commentDate.asc()).all()
            post_data['comments'] = [c.to_dict() for c in comments]
            
            # 추가 정보 조회: 내가 이 글에 좋아요를 눌렀는지?
            current_user_key = request.args.get('userKey')
            if current_user_key:
                is_liked = Likes.query.filter_by(postKey=post.postKey, userKey=current_user_key).first() is not None
                post_data['is_liked'] = is_liked
            else:
                post_data['is_liked'] = False

            result.append(post_data)
            
        return jsonify(result), 200

    # [POST] 게시물 작성하기
    if request.method == 'POST':
        if 'image' not in request.files:
            return jsonify({"message": "No image part"}), 400
        
        file = request.files['image']
        content = request.form.get('content', '')
        user_key = request.form.get('userKey')
        user_id = request.form.get('userID')

        if not user_key or not user_id:
             return jsonify({"message": "User info required"}), 400

        if file:
            # 게시물 이미지 저장
            filename = secure_filename(f"{datetime.datetime.now().timestamp()}_{file.filename}")
            file.save(os.path.join(app.root_path, app.config['UPLOAD_FOLDER'], filename))
            photo_src = f"/static/uploads/{filename}"
            
            # 게시물 저장 시, 시간은 서버 기준으로 datetime.now()를 직접 넣습니다 (KST 기준 마련).
            new_post = Post(
                userKey=user_key,
                userID=user_id,
                photoSrc=photo_src,
                content=content,
                postingDate=datetime.datetime.now()
            )
            
            try:
                db.session.add(new_post)
                db.session.commit()
                return jsonify({"message": "Post created", "post": new_post.to_dict()}), 201
            except Exception as e:
                db.session.rollback()
                return jsonify({"message": str(e)}), 500

# 7. 게시물 삭제
@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    user_key = request.args.get('userKey')
    
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"message": "Post not found"}), 404
        
    # 권한 확인: 글쓴이만 삭제할 수 있습니다.
    if str(post.userKey) != str(user_key):
        return jsonify({"message": "Unauthorized"}), 403

    try:
        # 게시물을 지우기 전에, 관련된 데이터(좋아요, 댓글)를 먼저 지워야 합니다 (참조 무결성).
        Likes.query.filter_by(postKey=post_id).delete()
        Comment.query.filter_by(postKey=post_id).delete()
        
        # 업로드했던 이미지 파일도 삭제 (서버 용량 관리)
        if post.photoSrc:
            relative_path = post.photoSrc.lstrip('/') # "/static..." -> "static..."
            file_path = os.path.join(app.root_path, relative_path)
            if os.path.exists(file_path):
                os.remove(file_path)
        
        db.session.delete(post)
        db.session.commit()
        return jsonify({"message": "Post deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

# 8. 댓글 삭제
@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    user_key = request.args.get('userKey')
        
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({"message": "Comment not found"}), 404
        
    # 권한 확인: 댓글 쓴 사람만 삭제 가능
    if str(comment.userKey) != str(user_key): 
        return jsonify({"message": "Unauthorized"}), 403
        
    try:
        db.session.delete(comment)
        db.session.commit()
        return jsonify({"message": "Comment deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

# 9. 좋아요 토글 (Toggle)
@app.route('/api/posts/<int:post_id>/likes', methods=['POST'])
def toggle_like(post_id):
    data = request.get_json()
    user_key = data.get('userKey')
    
    # 이미 좋아요가 있는지 체크
    existing_like = Likes.query.filter_by(postKey=post_id, userKey=user_key).first()
    
    try:
        if existing_like:
            # 이미 있으면 -> 취소 (DB에서 삭제)
            db.session.delete(existing_like)
            db.session.commit()
            return jsonify({"message": "Unliked", "liked": False}), 200
        else:
            # 없으면 -> 좋아요 추가 (DB에 추가)
            new_like = Likes(postKey=post_id, userKey=user_key)
            db.session.add(new_like)
            db.session.commit()
            return jsonify({"message": "Liked", "liked": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

# 10. 댓글 작성 (대댓글 포함)
@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    data = request.get_json()
    user_key = data.get('userKey')
    user_id = data.get('userID')
    content = data.get('content')
    parent_key = data.get('parentKey') # 부모 댓글 ID (대댓글인 경우)

    if not user_key or not content:
        return jsonify({"message": "Content and User Info required"}), 400
    
    if parent_key:
        parent_comment = Comment.query.get(parent_key)
        if not parent_comment:
            return jsonify({"message": "Parent comment not found"}), 404

    new_comment = Comment(
        postKey=post_id,
        userKey=user_key,
        parentKey=parent_key,
        userID=user_id,
        content=content,
        commentDate=datetime.datetime.now()
    )

    try:
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({"message": "Comment added", "comment": new_comment.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

# 메인 실행 블록
if __name__ == '__main__':
    with app.app_context():
        # db.create_all() # 필요하다면 DB 테이블 생성을 여기서 할 수 있습니다. (지금은 외부 스크립트 사용)
        pass
    app.run(debug=True, port=5000)
