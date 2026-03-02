"""
Script to make a user an admin
Usage: python make_admin.py <username>
"""
import sys
import globals

# MongoDB connection (adjust if needed)
users_collection = globals.Registerd_users

def make_admin(username):
    """Set a user as admin"""
    result = users_collection.update_one(
        {"username": username},
        {"$set": {"admin": True, "role": "admin"}}
    )
    
    if result.matched_count == 0:
        print(f"❌ User '{username}' not found")
        return False
    
    if result.modified_count > 0:
        print(f"✅ User '{username}' is now an admin")
    else:
        print(f"ℹ️  User '{username}' was already an admin")
    
    return True

def list_users():
    """List all users and their admin status"""
    users = users_collection.find({}, {"username": 1, "email": 1, "admin": 1, "role": 1})
    print("\n📋 All Users:")
    print("-" * 60)
    for user in users:
        username = user.get('username', 'N/A')
        email = user.get('email', 'N/A')
        is_admin = user.get('admin', False)
        role = user.get('role', 'user')
        admin_badge = "👑 ADMIN" if is_admin else "👤 USER"
        print(f"{admin_badge} | {username:20} | {email:30} | role: {role}")
    print("-" * 60)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <username>")
        print("   or: python make_admin.py --list")
        sys.exit(1)
    
    if sys.argv[1] == "--list":
        list_users()
    else:
        username = sys.argv[1]
        make_admin(username)
        print("\n💡 Now sign out and sign in again to see User Management")
