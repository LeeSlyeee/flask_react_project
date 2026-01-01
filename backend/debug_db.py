from app import app, db, Member, Post

with app.app_context():
    print("=== Members ===")
    members = Member.query.all()
    for m in members:
        print(f"Key: {m.userKey}, ID: {m.userID}, Profile: {m.profileImage}")

    print("\n=== Posts ===")
    posts = Post.query.all()
    for p in posts:
        print(f"PostKey: {p.postKey}, UserKey: {p.userKey}, UserID: {p.userID}")
