"""
Authentication and Authorization decorators.
Provides @jwt_required, @role_required, and @admin_required decorators to protect routes.
"""
from functools import wraps
from flask import jsonify, request, make_response
import jwt
import globals

# Blacklist collection:holds JWTs that are no longer valid (logged out)
blacklist = globals.db.BlackList


def jwt_required(func):
    @wraps(func)
    def jwt_required_wrapper(*args, **kwargs):
        token = None

        # Look for token in custom header
        if "x-access-token" in request.headers:
            token = request.headers["x-access-token"]
        if not token:
            return make_response(jsonify({"Message": "Token is missing"}), 401)

        # Validate token signature + expiry
        try:
            data = jwt.decode(token, globals.SECRET_KEY, algorithms=["HS256"])
        except:
            return make_response(jsonify({"Message": "Invalid token"}), 401)

        # Check if token is blacklisted (e.g.user logged out)
        bl_token = blacklist.find_one({"token": token})
        if bl_token is not None:
            return make_response(jsonify({"Message": "Token has been cancelled"}), 401)

        # Store decoded token data in request context for role_required
        request.jwt_data = data

        # call the original route
        return func(*args, **kwargs)

    return jwt_required_wrapper


def role_required(allowed_roles):
    """
    Decorator to restrict access based on user roles.
    Must be used after @jwt_required decorator.
    
    Usage:
        @jwt_required
        @role_required(["admin"])
        def admin_only_route():
            pass
            
        @jwt_required
        @role_required(["admin", "user"])
        def admin_and_user_route():
            pass
    
    Args:
        allowed_roles: List of roles that can access this route
                      Options: ["admin", "user", "guest"]
    """
    def decorator(func):
        @wraps(func)
        def role_required_wrapper(*args, **kwargs):
            # Get JWT data from request context (set by jwt_required)
            if not hasattr(request, 'jwt_data'):
                return make_response(
                    jsonify({"Message": "Authentication required"}), 401
                )
            
            jwt_data = request.jwt_data
            user_role = jwt_data.get("role", "guest")
            
            # Check if user's role is in allowed roles
            if user_role not in allowed_roles:
                return make_response(
                    jsonify({
                        "Message": "Access forbidden",
                        "required_role": allowed_roles,
                        "your_role": user_role
                    }), 403
                )
            
            # Role is allowed, proceed
            return func(*args, **kwargs)
        
        return role_required_wrapper
    return decorator


def admin_required(func):
    """
    Decorator to restrict access to admin users only.
    Must be used after @jwt_required decorator.
    
    Usage:
        @jwt_required
        @admin_required
        def admin_only_route():
            pass
    
    This is a convenience decorator equivalent to @role_required(["admin"])
    """
    @wraps(func)
    def admin_required_wrapper(*args, **kwargs):
        # Get JWT data from request context (set by jwt_required)
        if not hasattr(request, 'jwt_data'):
            return make_response(
                jsonify({"message": "Authentication required"}), 401
            )
        
        jwt_data = request.jwt_data
        is_admin = jwt_data.get("admin", False)
        
        # Check if user is admin
        if not is_admin:
            return make_response(
                jsonify({"message": "Admin only"}), 403
            )
        
        # User is admin, proceed
        return func(*args, **kwargs)
    
    return admin_required_wrapper
