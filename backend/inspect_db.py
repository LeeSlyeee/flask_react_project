from app import app, db
from sqlalchemy import inspect

with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print("Existing tables:", tables)
    
    for table in tables:
        print(f"\nTable: {table}")
        fks = inspector.get_foreign_keys(table)
        for fk in fks:
            print(f"  - FK points to: {fk['referred_table']} (Constraint: {fk['name']})")
