from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        with db.engine.connect() as connection:
            connection.execute(text("ALTER TABLE Member ADD COLUMN profileImage VARCHAR(255)"))
            print("Successfully added profileImage column.")
    except Exception as e:
        print(f"Error (might already exist): {e}")
