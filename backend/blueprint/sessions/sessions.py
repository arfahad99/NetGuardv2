"""
Sessions blueprint for tracking connection metadata.
Manages user network sessions, geo-locations, and timeline data.
"""
from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required, role_required

# Database connection
import globals

sessions = globals.db.sessions

# Create Blueprint for sessions routes
sessions_bp = Blueprint("sessions_bp", __name__)


# Get all sessions with pagination - requires JWT auth
@sessions_bp.route("/sessions", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_all_sessions():
    data_to_return = []
    # Get pagination parameters from query string with defaults
    page_num = request.args.get("pn", default=1, type=int)
    page_size = request.args.get("ps", default=10, type=int)
    page_start = (page_num - 1) * page_size

    try:
        # Fetch sessions from database with pagination
        sessions_cursor = sessions.find().skip(page_start).limit(page_size)

        # Loop through each session and prepare for JSON serialization
        for session in sessions_cursor:
            # Convert ObjectId to string for JSON serialization
            session["_id"] = str(session["_id"])
            data_to_return.append(session)

        # Return success response with sessions
        return make_response(jsonify(data_to_return), 200)

    except ConnectionError:
        # Handle database connection errors
        return make_response(jsonify({"error": "Database connection error"}), 500)

    except Exception as e:
        # Handle any other unexpected errors
        return make_response(
            jsonify({"error": "Internal Server Error", "details": str(e)}), 500
        )


# Get single session by ID - requires JWT auth
@sessions_bp.route("/sessions/<string:session_id>", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_one_session(session_id):
    # Find single session by ID in database
    session = sessions.find_one({"_id": session_id})

    # Check if session exists
    if session is not None:
        # Convert ObjectId to string for JSON serialization
        session["_id"] = str(session["_id"])
        # Return session data
        return make_response(jsonify(session), 200)
    else:
        # Return 404 if session not found
        return make_response(jsonify({"Error": "Session not found"}), 404)


# Create new session - requires session_id and user_id
@sessions_bp.route("/sessions", methods=["POST"])
@jwt_required
@role_required(["admin", "user"])
def add_session():
    # Get form data from request
    data = request.form

    # Validate required fields are present
    if data and "session_id" in data and "user_id" in data:
        # Create new session object with all fields
        new_session = {
            "session_id": data.get("session_id"),
            # User reference information
            "user_ref": {"user_id": data.get("user_id")},
            # Timeline information
            "timeline": {
                "started_at": data.get("started_at", ""),
                "timezone": data.get("timezone", "UTC+0"),
            },
            # Context information
            "context": {
                "temporal": {
                    "day_of_week": data.get("day_of_week", ""),
                    "hour": int(data.get("hour", 0)),
                    "is_peak_hour": data.get("is_peak_hour", "false").lower() == "true",
                    "time_segment": data.get("time_segment", ""),
                },
                "geo": {
                    "type": data.get("geo_type", "Point"),
                    "coordinates": [
                        float(data.get("longitude", 0)),
                        float(data.get("latitude", 0)),
                    ],
                },
            },
            # Metrics summary information
            "metrics_summary": {
                "duration_sec": int(data.get("duration_sec", 0)),
                "samples": int(data.get("samples", 0)),
                "avg_latency_ms": float(data.get("avg_latency_ms", 0)),
            },
        }

        # Insert new session into database
        results = sessions.insert_one(new_session)
        new_session_db_id = str(results.inserted_id)
        # Create URL for newly created session
        new_session_link = f"http://127.0.0.1:5001/sessions/{new_session_db_id}"

        return make_response(
            jsonify(
                {
                    "message": "Session created successfully",
                    "session_id": new_session_db_id,
                    "URL": new_session_link,
                }
            ),
            201,
        )
    else:
        # Return error if required fields missing
        return make_response(
            jsonify({"Error": "Missing required fields: session_id and user_id"}), 400
        )


# Update existing session - partial updates supported
@sessions_bp.route("/sessions/<string:session_id>", methods=["PUT"])
@jwt_required
@role_required(["admin", "user"])
def update_session(session_id):
    # Get form data from request
    data = request.form
    update_field = {}

    # Check top-level fields and add to update object if present
    if data.get("session_id"):
        update_field["session_id"] = data.get("session_id")

    # Update nested user reference fields
    if data.get("user_id"):
        update_field["user_ref.user_id"] = data.get("user_id")

    # Update nested timeline fields
    if data.get("started_at"):
        update_field["timeline.started_at"] = data.get("started_at")
    if data.get("timezone"):
        update_field["timeline.timezone"] = data.get("timezone")

    # Update nested context temporal fields
    if data.get("day_of_week"):
        update_field["context.temporal.day_of_week"] = data.get("day_of_week")
    if data.get("hour"):
        update_field["context.temporal.hour"] = int(data.get("hour"))
    if data.get("is_peak_hour"):
        update_field["context.temporal.is_peak_hour"] = (
            data.get("is_peak_hour").lower() == "true"
        )
    if data.get("time_segment"):
        update_field["context.temporal.time_segment"] = data.get("time_segment")

    # Update nested context geo fields
    if data.get("geo_type"):
        update_field["context.geo.type"] = data.get("geo_type")

    # Update coordinates if both longitude and latitude are provided
    if data.get("longitude") and data.get("latitude"):
        update_field["context.geo.coordinates"] = [
            float(data.get("longitude")),
            float(data.get("latitude")),
        ]

    # Update nested metrics summary fields
    if data.get("duration_sec"):
        update_field["metrics_summary.duration_sec"] = int(data.get("duration_sec"))
    if data.get("samples"):
        update_field["metrics_summary.samples"] = int(data.get("samples"))
    if data.get("avg_latency_ms"):
        update_field["metrics_summary.avg_latency_ms"] = float(
            data.get("avg_latency_ms")
        )

    # Check if there are fields to update
    if not update_field:
        return make_response(jsonify({"Error": "No valid data passed"}), 400)

    # Update session in database
    results = sessions.update_one(
        {"_id": session_id}, {"$set": update_field}
    )

    # Check if update was successful
    if results.modified_count == 1:
        # Create URL for updated session
        updated_session_link = f"http://127.0.0.1:5001/sessions/{session_id}"
        return make_response(
            jsonify(
                {
                    "message": "Session updated successfully",
                    "session_id": session_id,
                    "URL": updated_session_link,
                }
            ),
            200,
        )
    else:
        # Return 404 if no changes made
        return make_response(jsonify({"message": "No changes made"}), 404)


# Delete session by ID - requires JWT auth
@sessions_bp.route("/sessions/<string:session_id>", methods=["DELETE"])
@jwt_required
@role_required(["admin"])
def delete_session(session_id):
    # Delete session by ID
    results = sessions.delete_one({"_id": session_id})

    # Check if deletion was successful
    if results.deleted_count == 1:
        return make_response(jsonify({"message": "Session deleted"}), 200)
    else:
        # Return 404 if session not found
        return make_response(jsonify({"message": "Session not found"}), 404)
