from app import app, db, Member, Post

with app.app_context():
    target_user_id = "kiking"
    print(f"--- Debugging for target_user_id: '{target_user_id}' ---")
    
    # 1. Find Member
    target_member = None
    if '@' in target_user_id:
         target_member = Member.query.filter_by(userID=target_user_id).first()
    else:
         print(f"Searching like '{target_user_id}@%'")
         target_member = Member.query.filter(Member.userID.like(f"{target_user_id}@%")).first()
         
         if not target_member:
             print("Not found with like, searching exact")
             target_member = Member.query.filter_by(userID=target_user_id).first()
             
    print(f"Target Member: {target_member}")
    
    if target_member:
        # 2. Find Posts
        print(f"Filtering posts by userKey: {target_member.userKey}")
        posts = Post.query.filter_by(userKey=target_member.userKey).order_by(Post.postingDate.desc()).all()
        print(f"Found {len(posts)} posts")
        for p in posts:
            print(f" - Post {p.postKey} by {p.userID}")
    else:
        print("Empty list (Member not found)")
