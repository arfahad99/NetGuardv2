# --------------------------------------------------------------------------
# DO I NEED THIS CODE? -> NO, NOT FOR RUNNING THE APP
# WHY? -> This was a one-off utility script used in the past to migrate 
# your codebase from using MongoDB (ObjectId) to DynamoDB (String IDs).
# You don't need to run this during your demo or code walkthrough!
# --------------------------------------------------------------------------
import os
import re

def migrate_file(filepath):
    print("Migrating", filepath)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove 'from bson import ObjectId'
    content = re.sub(r'from bson import ObjectId[\r\n]*', '', content)
    
    # Replace ObjectId(some_var) with some_var
    content = re.sub(r'ObjectId\(([^)]+)\)', r'\1', content)

    # Replace user globals import for make_admin.py
    if "make_admin.py" in filepath:
        content = content.replace("from pymongo import MongoClient", "import globals")
        content = content.replace("client = MongoClient('mongodb://localhost:27017/')\ndb = client['NPMDB']  # Adjust database name if different\nusers_collection = db['Registerd_users']", "users_collection = globals.Registerd_users")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    blueprints_dir = r"e:\Ulster Year 3\COM668 (78887) - Computing Project\Main Project\NetGuardV2\backend\blueprint"
    for root, dirs, files in os.walk(blueprints_dir):
        for f in files:
            if f.endswith('.py'):
                migrate_file(os.path.join(root, f))
    
    ma_path = r"e:\Ulster Year 3\COM668 (78887) - Computing Project\Main Project\NetGuardV2\backend\make_admin.py"
    if os.path.exists(ma_path):
        migrate_file(ma_path)

if __name__ == '__main__':
    main()
