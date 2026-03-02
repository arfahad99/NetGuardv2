from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required
import bcrypt
import jwt
import datetime
import uuid
import globals

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/auth")


# DB:Collections
Registerd_users = globals.db.Registerd_users
blacklist = globals.db.BlackList


# --------------Signup Code Start---------------


@auth_bp.route("/Signup", methods=["POST"])
def Signup():
    # Read body (form-data/x-www-form-urlencoded or JSON)
    if request.content_type and request.content_type.startswith("application/json"):
        data = request.get_json(silent=True) or {}
    else:
        data = request.form.to_dict()

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")  # required

    # Need username OR email, and password
    if (not username and not email) or not password:
        return make_response(
            jsonify({"error": "username or email, and password required"}), 400
        )

    # Uniqueness check for username and email separately
    existing_conflicts = []
    
    if username:
        existing_user = globals.Registerd_users.find_one({"username": username})
        if existing_user:
            existing_conflicts.append("username")
    
    if email:
        existing_email = globals.Registerd_users.find_one({"email": email})
        if existing_email:
            existing_conflicts.append("email")
    
    if existing_conflicts:
        if len(existing_conflicts) == 2:
            error_message = "Both username and email already exist"
        elif "username" in existing_conflicts:
            error_message = "Username already exists"
        else:
            error_message = "Email already exists"
        
        return make_response(
            jsonify({
                "error": error_message,
                "conflicts": existing_conflicts
            }), 409
        )

    # Hash and store user
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    doc = {"password": hashed}
    if username:
        doc["username"] = username
    if email:
        doc["email"] = email
    # Ensure every user document has an explicit admin flag (default: False)
    doc["admin"] = False

    result = globals.Registerd_users.insert_one(doc)

    # Success response
    return make_response(
        jsonify(
            {
                "message": "Signup successful,Go-to SignIn For Access",
                "user_id": str(result.inserted_id),
            }
        ),
        201,
    )


# --------------Signup Code End---------------


# --------------Signin Code Start---------------


@auth_bp.route("/Signin", methods=["POST"])
def Signin():
    auth = request.authorization
    if not auth:
        return make_response(jsonify({"Message": "Authentication required"}), 401)

    # Find user by username
    user = Registerd_users.find_one({"username": auth.username})
    if not user:
        return make_response(jsonify({"Message": "Invalid username"}), 401)

    # Compare password using bcrypt
    if bcrypt.checkpw(bytes(auth.password, "UTF-8"), user["password"]):
        # Determine role
        role = "admin" if user.get("admin", False) else user.get("role", "user")
        
        token = jwt.encode(
            {
                "user": auth.username,
                "admin": user.get("admin", False),
                "role": role,
                # Use UTC now for expiry
                "exp": datetime.datetime.now(datetime.UTC)
                + datetime.timedelta(minutes=120),
            },
            globals.SECRET_KEY,
            algorithm="HS256",
        )
        # Return the token, role, and success message to the client
        return make_response(jsonify({
            "msg": "SignIn Successful", 
            "token": token,
            "role": role,
            "username": auth.username
        }), 200)

    return make_response(jsonify({"Message": "Invalid password"}), 401)


# --------------Signin Code End---------------


# --------------Guest Login Code Start---------------


@auth_bp.route("/GuestLogin", methods=["POST"])
def GuestLogin():
    # Generate a unique guest username
    guest_id = str(uuid.uuid4())[:8]
    guest_username = f"guest_{guest_id}"
    
    # Create guest token (expires in 1 hour)
    token = jwt.encode(
        {
            "user": guest_username,
            "admin": False,
            "role": "guest",
            "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
        },
        globals.SECRET_KEY,
        algorithm="HS256",
    )
    
    return make_response(jsonify({
        "msg": "Guest login successful",
        "token": token,
        "role": "guest",
        "username": guest_username
    }), 200)


# --------------Guest Login Code End---------------


# --------------Signout Code Start---------------


@auth_bp.route("/Signout", methods=["POST"])
@jwt_required
def Signout():
    # Get the token from the header
    token = request.headers.get("x-access-token")

    # Add to blacklist
    blacklist.insert_one({"token": token})

    return make_response(jsonify({"Message": "Successfully Signout out"}), 200)


# --------------Signout Code End---------------
