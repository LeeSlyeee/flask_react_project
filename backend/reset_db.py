from app import app, db
import os
import shutil

with app.app_context():
    try:
        print("Reflecting all existing tables from database...")
        # DB에 있는 모든 테이블 정보를 읽어옵니다.
        db.MetaData.reflect(db.metadata, bind=db.engine)
        
        print(f"Found tables: {list(db.metadata.tables.keys())}")
        
        print("Dropping ALL tables...")
        # 읽어온 정보(db.metadata)를 바탕으로 모든 테이블 삭제
        db.drop_all()
        
        print("Creating tables defined in models.py...")
        # models.py에 정의된 테이블 생성 (Profile 테이블은 models.py에 없으므로 생성 안 됨)
        db.create_all()
        
        print("Database schema successfully reset.")

        # 업로드된 파일 삭제
        upload_folder = app.config.get('UPLOAD_FOLDER', 'static/uploads')
        folder_path = os.path.join(app.root_path, upload_folder)
        
        if os.path.exists(folder_path):
            print(f"Cleaning upload folder: {folder_path}")
            for filename in os.listdir(folder_path):
                file_path = os.path.join(folder_path, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                         os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as e:
                    print(f'Failed to delete {file_path}. Reason: {e}')
        else:
            print("Upload folder does not exist, creating it...")
            os.makedirs(folder_path)

        print("System reset complete.")

    except Exception as e:
        print(f"Error during reset: {e}")
