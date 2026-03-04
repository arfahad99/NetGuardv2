"""
Users blueprint for administrative user management.
Allows Admins to view, create, edit, and delete registered platform accounts.
"""
from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required, admin_required
import bcrypt
import globals

users_bp = Blueprint("users_bp", __name__, url_prefix="/users")

# DB: Collections
Registerd_users = globals.db.Registerd_users


# --------------Get All Users Code Start---------------


@users_bp.route("", methods=["GET"])
@jwt_required
@admin_required
def get_all_users():
    """
    Get all users (admin only).
    Returns list of users without password hashes.
    """
    try:
        users_list = []
        
        # Fetch all users from database
        users_cursor = Registerd_users.find()
        
        for user in users_cursor:
            # Convert ObjectId to string and exclude password
            user_data = {
                "_id": str(user["_id"]),
                "username": user.get("username", ""),
                "email": user.get("email", ""),
                "admin": user.get("admin", False)
            }
            users_list.append(user_data)
        
        return make_response(jsonify(users_list), 200)
    
    except Exception as e:
        return make_response(
            jsonify({"error": "Failed to fetch users", "details": str(e)}), 500
        )


# --------------Get All Users Code End---------------


# --------------Get Single User Code Start---------------


@users_bp.route("/<string:user_id>", methods=["GET"])
@jwt_required
@admin_required
def get_one_user(user_id):
    """
    Get a single user by ID (admin only).
    Returns user without password hash.
    """
    try:
        # Find user by ID
        user = Registerd_users.find_one({"_id": user_id})
        
        if user is None:
            return make_response(jsonify({"error": "User not found"}), 404)
        
        # Prepare user data without password
        user_data = {
            "_id": str(user["_id"]),
            "username": user.get("username", ""),
            "email": user.get("email", ""),
            "admin": user.get("admin", False)
        }
        
        return make_response(jsonify(user_data), 200)
    
    except Exception as e:
        return make_response(
            jsonify({"error": "Failed to fetch user", "details": str(e)}), 500
        )


# --------------Get Single User Code End---------------


# --------------Update User Code Start---------------


@users_bp.route("/<string:user_id>", methods=["PUT"])
@jwt_required
@admin_required
def update_user(user_id):
    """
    Update a user (admin only).
    Can update: username, email, admin status.
    Cannot update password (use separate endpoint).
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return make_response(jsonify({"error": "No data provided"}), 400)
        
        # Check if user exists
        user = Registerd_users.find_one({"_id": user_id})
        if user is None:
            return make_response(jsonify({"error": "User not found"}), 404)
        
        # Prepare update fields
        update_fields = {}
        
        if "username" in data:
            # Check if username is already taken by another user
            existing = Registerd_users.find_one({
                "username": data["username"],
                "_id": {"$ne": user_id}
            })
            if existing:
                return make_response(
                    jsonify({"error": "Username already exists"}), 409
                )
            update_fields["username"] = data["username"]
        
        if "email" in data:
            # Check if email is already taken by another user
            existing = Registerd_users.find_one({
                "email": data["email"],
                "_id": {"$ne": user_id}
            })
            if existing:
                return make_response(
                    jsonify({"error": "Email already exists"}), 409
                )
            update_fields["email"] = data["email"]
        
        if "admin" in data:
            # Validate admin is boolean
            if not isinstance(data["admin"], bool):
                return make_response(
                    jsonify({"error": "Admin field must be boolean"}), 400
                )
            update_fields["admin"] = data["admin"]
        
        # Check if there are fields to update
        if not update_fields:
            return make_response(
                jsonify({"error": "No valid fields to update"}), 400
            )
        
        # Update user in database
        result = Registerd_users.update_one(
            {"_id": user_id},
            {"$set": update_fields}
        )
        
        if result.modified_count == 1:
            return make_response(
                jsonify({
                    "message": "User updated successfully",
                    "user_id": user_id
                }), 200
            )
        else:
            return make_response(
                jsonify({"message": "No changes made"}), 200
            )
    
    except Exception as e:
        return make_response(
            jsonify({"error": "Failed to update user", "details": str(e)}), 500
        )


# --------------Update User Code End---------------


# --------------Delete User Code Start---------------


@users_bp.route("/<string:user_id>", methods=["DELETE"])
@jwt_required
@admin_required
def delete_user(user_id):
    """
    Delete a user (admin only).
    Prevents deleting your own account.
    """
    try:
        # Get current user from JWT token
        current_username = request.jwt_data.get("user")
        
        # Find the user to be deleted
        user_to_delete = Registerd_users.find_one({"_id": user_id})
        
        if user_to_delete is None:
            return make_response(jsonify({"error": "User not found"}), 404)
        
        # Prevent deleting your own account
        if user_to_delete.get("username") == current_username:
            return make_response(
                jsonify({"error": "You cannot delete your own account"}), 400
            )
        
        # Delete the user
        result = Registerd_users.delete_one({"_id": user_id})
        
        if result.deleted_count == 1:
            return make_response(
                jsonify({"message": "User deleted successfully"}), 200
            )
        else:
            return make_response(
                jsonify({"error": "Failed to delete user"}), 500
            )
    
    except Exception as e:
        return make_response(
            jsonify({"error": "Failed to delete user", "details": str(e)}), 500
        )


# --------------Delete User Code End---------------


# --------------Create User Code Start---------------


@users_bp.route("", methods=["POST"])
@jwt_required
@admin_required
def create_user():
    """
    Create a new user (admin only).
    Requires: username, email, password, admin (boolean).
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return make_response(jsonify({"error": "No data provided"}), 400)
        
        # Validate required fields
        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password")
        admin = data.get("admin", False)
        
        if not username or not email or not password:
            return make_response(
                jsonify({"error": "Username, email, and password are required"}), 400
            )
        
        # Validate admin is boolean
        if not isinstance(admin, bool):
            return make_response(
                jsonify({"error": "Admin field must be boolean"}), 400
            )
        
        # Check if username or email already exists
        existing = Registerd_users.find_one({
            "$or": [
                {"username": username},
                {"email": email}
            ]
        })
        
        if existing:
            return make_response(
                jsonify({"error": "Username or email already exists"}), 409
            )
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        
        # Create new user document
        new_user = {
            "username": username,
            "email": email,
            "password": hashed_password,
            "admin": admin
        }
        
        # Insert into database
        result = Registerd_users.insert_one(new_user)
        
        return make_response(
            jsonify({
                "message": "User created successfully",
                "user_id": str(result.inserted_id)
            }), 201
        )
    
    except Exception as e:
        return make_response(
            jsonify({"error": "Failed to create user", "details": str(e)}), 500
        )


# --------------Create User Code End---------------
