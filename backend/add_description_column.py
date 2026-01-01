from app import app, db
from sqlalchemy import text

# ==============================================================================
# DB 마이그레이션 스크립트 (Member 테이블에 description 컬럼 추가)
# ==============================================================================
with app.app_context():
    try:
        with db.engine.connect() as connection:
            # ALTER TABLE 명령어로 'description' 컬럼을 추가합니다.
            connection.execute(text("ALTER TABLE Member ADD COLUMN description VARCHAR(500)"))
            connection.commit()
            print("Successfully added 'description' column to Member table.")
    except Exception as e:
        # 이미 컬럼이 있거나 다른 에러가 발생한 경우
        print(f"Error (column might already exist): {e}")
