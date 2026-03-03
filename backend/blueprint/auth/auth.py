from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required
import bcrypt
import jwt
import datetime
import uuid
import os
import boto3
from botocore.exceptions import ClientError
import globals

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/auth")


# DB:Collections
Registerd_users = globals.db.Registerd_users
blacklist = globals.db.BlackList

# Cognito Setup
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
cognito_client = boto3.client('cognito-idp', region_name=os.getenv('AWS_REGION', 'us-east-1')) if COGNITO_CLIENT_ID else None


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

    # 1. Amazon Cognito Integration (If configured)
    if COGNITO_CLIENT_ID and cognito_client:
        try:
            # We use the email as the Cognito username usually, but we can pass attributes
            resp = cognito_client.sign_up(
                ClientId=COGNITO_CLIENT_ID,
                Username=username,
                Password=password,
                UserAttributes=[
                    {'Name': 'email', 'Value': email}
                ]
            )
            
            # Still store in local database to map roles/admin
            hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
            doc = {"password": hashed, "username": username, "email": email, "admin": False, "verified": False}
            result = globals.Registerd_users.insert_one(doc)

            return make_response(jsonify({
                "message": "Signup successful. Please verify your email.",
                "requires_verification": True,
                "user_id": str(result.inserted_id)
            }), 201)
            
        except ClientError as e:
            return make_response(jsonify({"error": e.response['Error']['Message']}), 400)

    # 2. Local Database Fallback (If Cognito not configured)

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
                "requires_verification": False,
                "user_id": str(result.inserted_id),
            }
        ),
        201,
    )

@auth_bp.route("/Verify", methods=["POST"])
def Verify():
    """Endpoint for Amazon Cognito Confirmation Code Verification"""
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    code = data.get("code", "").strip()

    if not username or not code:
        return make_response(jsonify({"error": "Username and verification code required"}), 400)

    if not COGNITO_CLIENT_ID or not cognito_client:
        # If Cognito is disabled, auto-verify for dev
        return make_response(jsonify({"message": "Local dev: auto-verified"}), 200)

    try:
        cognito_client.confirm_sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=username,
            ConfirmationCode=code
        )
        
        # Mark as verified in local DB
        Registerd_users.update_one({"username": username}, {"$set": {"verified": True}})

        return make_response(jsonify({"message": "Verification successful. You can now log in."}), 200)

    except ClientError as e:
        return make_response(jsonify({"error": e.response['Error']['Message']}), 400)


@auth_bp.route("/ResendCode", methods=["POST"])
def ResendCode():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()

    if not username:
        return make_response(jsonify({"error": "Username required"}), 400)

    if not COGNITO_CLIENT_ID or not cognito_client:
        return make_response(jsonify({"error": "Cognito not configured"}), 400)

    try:
        cognito_client.resend_confirmation_code(
            ClientId=COGNITO_CLIENT_ID,
            Username=username
        )
        return make_response(jsonify({"message": "Verification code resent."}), 200)
    except ClientError as e:
        return make_response(jsonify({"error": e.response['Error']['Message']}), 400)

# --------------Signup Code End---------------


# --------------Signin Code Start---------------


@auth_bp.route("/Signin", methods=["POST"])
def Signin():
    auth = request.authorization
    if not auth:
        return make_response(jsonify({"Message": "Authentication required"}), 401)

    login_identifier = auth.username
    
    # Find user by username OR email
    user = Registerd_users.find_one({"$or": [{"username": login_identifier}, {"email": login_identifier}]})
    
    if not user:
        return make_response(jsonify({"Message": "Invalid username or email"}), 401)

    # Compare password using bcrypt
    stored_pw = user["password"]
    if isinstance(stored_pw, str):
        stored_pw = stored_pw.encode("utf-8")
    if bcrypt.checkpw(bytes(auth.password, "UTF-8"), stored_pw):
        # Determine role
        role = "admin" if user.get("admin", False) else user.get("role", "user")
        
        # Get the actual username from the db (so the token always has the username)
        actual_username = user.get("username", login_identifier)
        
        token = jwt.encode(
            {
                "user": actual_username,
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
            "username": actual_username
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
