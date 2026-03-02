from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required, role_required

# Database connection
import globals

qos_events = globals.db.qos_events

# Create Blueprint for QoS events routes
qos_events_bp = Blueprint("qos_events_bp", __name__)


# Get all QoS events with pagination - requires JWT auth
@qos_events_bp.route("/qos-events", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_all_qos_events():
    data_to_return = []
    # Get pagination parameters from query string with defaults
    page_num = request.args.get("pn", default=1, type=int)
    page_size = request.args.get("ps", default=10, type=int)
    page_start = (page_num - 1) * page_size

    try:
        # Fetch QoS events from database with pagination
        qos_cursor = qos_events.find().skip(page_start).limit(page_size)

        # Loop through each QoS event and prepare for JSON serialization
        for event in qos_cursor:
            # Convert ObjectId to string for JSON serialization
            event["_id"] = str(event["_id"])
            data_to_return.append(event)

        # Return success response with QoS events
        return make_response(jsonify(data_to_return), 200)

    except ConnectionError:
        # Handle database connection errors
        return make_response(jsonify({"error": "Database connection error"}), 500)

    except Exception as e:
        # Handle any other unexpected errors
        return make_response(
            jsonify({"error": "Internal Server Error", "details": str(e)}), 500
        )


# Get single QoS event by ID - requires JWT auth
@qos_events_bp.route("/qos-events/<string:event_id>", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_one_qos_event(event_id):
    # Find single QoS event by ID in database
    event = qos_events.find_one({"_id": event_id})

    # Check if event exists
    if event is not None:
        # Convert ObjectId to string for JSON serialization
        event["_id"] = str(event["_id"])
        # Return event data
        return make_response(jsonify(event), 200)
    else:
        # Return 404 if event not found
        return make_response(jsonify({"Error": "QoS event not found"}), 404)


# Create new QoS event - requires user_id and application_type
@qos_events_bp.route("/qos-events", methods=["POST"])
@jwt_required
@role_required(["admin", "user"])
def add_qos_event():
    # Get form data from request
    data = request.form

    # Validate required fields are present
    if data and "user_id" in data and "application_type" in data:
        # Create new QoS event object with all fields
        new_event = {
            # Timestamp information
            "Timestamp": {
                "unix": int(data.get("timestamp_unix", 0)),
                "window_seconds": int(data.get("window_seconds", 30)),
            },
            "User_ID": data.get("user_id"),
            "Application_Type": data.get("application_type"),
            # Signal strength information
            "Signal_Strength": {
                "value_dbm": float(data.get("signal_value_dbm", 0)),
                "snr_db": float(data.get("signal_snr_db", 0)),
                "quality": data.get("signal_quality", "Fair"),
            },
            # Latency information
            "Latency": {
                "avg_ms": float(data.get("latency_avg_ms", 0)),
                "jitter_ms": float(data.get("latency_jitter_ms", 0)),
            },
            # Required bandwidth information
            "Required_Bandwidth": {"mbps": float(data.get("required_bandwidth_mbps", 0))},
            # Allocated bandwidth information
            "Allocated_Bandwidth": {
                "mbps": float(data.get("allocated_bandwidth_mbps", 0)),
                "utilization_percent": float(data.get("bandwidth_utilization_percent", 0)),
            },
            # Resource allocation information
            "Resource_Allocation": {
                "percent": float(data.get("resource_allocation_percent", 0)),
                "breakdown": {
                    "cpu_percent": float(data.get("cpu_percent", 0)),
                    "memory_percent": float(data.get("memory_percent", 0)),
                    "radio_percent": float(data.get("radio_percent", 0)),
                },
            },
        }

        # Insert new QoS event into database
        results = qos_events.insert_one(new_event)
        new_event_id = str(results.inserted_id)
        # Create URL for newly created event
        new_event_link = f"http://127.0.0.1:5001/qos-events/{new_event_id}"

        return make_response(
            jsonify(
                {
                    "message": "QoS event created successfully",
                    "event_id": new_event_id,
                    "URL": new_event_link,
                }
            ),
            201,
        )
    else:
        # Return error if required fields missing
        return make_response(
            jsonify({"Error": "Missing required fields: user_id and application_type"}),
            400,
        )


# Update existing QoS event - partial updates supported
@qos_events_bp.route("/qos-events/<string:event_id>", methods=["PUT"])
@jwt_required
@role_required(["admin", "user"])
def update_qos_event(event_id):
    # Get form data from request
    data = request.form
    update_field = {}

    # Check each field and add to update object if present
    if data.get("user_id"):
        update_field["User_ID"] = data.get("user_id")
    if data.get("application_type"):
        update_field["Application_Type"] = data.get("application_type")

    # Update nested timestamp fields
    if data.get("timestamp_unix"):
        update_field["Timestamp.unix"] = int(data.get("timestamp_unix"))
    if data.get("window_seconds"):
        update_field["Timestamp.window_seconds"] = int(data.get("window_seconds"))

    # Update nested signal strength fields
    if data.get("signal_value_dbm"):
        update_field["Signal_Strength.value_dbm"] = float(data.get("signal_value_dbm"))
    if data.get("signal_snr_db"):
        update_field["Signal_Strength.snr_db"] = float(data.get("signal_snr_db"))
    if data.get("signal_quality"):
        update_field["Signal_Strength.quality"] = data.get("signal_quality")

    # Update nested latency fields
    if data.get("latency_avg_ms"):
        update_field["Latency.avg_ms"] = float(data.get("latency_avg_ms"))
    if data.get("latency_jitter_ms"):
        update_field["Latency.jitter_ms"] = float(data.get("latency_jitter_ms"))

    # Update nested bandwidth fields
    if data.get("required_bandwidth_mbps"):
        update_field["Required_Bandwidth.mbps"] = float(
            data.get("required_bandwidth_mbps")
        )
    if data.get("allocated_bandwidth_mbps"):
        update_field["Allocated_Bandwidth.mbps"] = float(
            data.get("allocated_bandwidth_mbps")
        )
    if data.get("bandwidth_utilization_percent"):
        update_field["Allocated_Bandwidth.utilization_percent"] = float(
            data.get("bandwidth_utilization_percent")
        )

    # Update nested resource allocation fields
    if data.get("resource_allocation_percent"):
        update_field["Resource_Allocation.percent"] = float(
            data.get("resource_allocation_percent")
        )
    if data.get("cpu_percent"):
        update_field["Resource_Allocation.breakdown.cpu_percent"] = float(
            data.get("cpu_percent")
        )
    if data.get("memory_percent"):
        update_field["Resource_Allocation.breakdown.memory_percent"] = float(
            data.get("memory_percent")
        )
    if data.get("radio_percent"):
        update_field["Resource_Allocation.breakdown.radio_percent"] = float(
            data.get("radio_percent")
        )

    # Check if there are fields to update
    if not update_field:
        return make_response(jsonify({"Error": "No valid data passed"}), 400)

    # Update QoS event in database
    results = qos_events.update_one(
        {"_id": event_id}, {"$set": update_field}
    )

    # Check if update was successful
    if results.modified_count == 1:
        # Create URL for updated event
        updated_event_link = f"http://127.0.0.1:5001/qos-events/{event_id}"

        return make_response(
            jsonify(
                {
                    "message": "QoS event updated successfully",
                    "event_id": event_id,
                    "URL": updated_event_link,
                }
            ),
            200,
        )
    else:
        # Return 404 if no changes made
        return make_response(jsonify({"message": "No changes made"}), 404)


# Delete QoS event by ID - requires JWT auth
@qos_events_bp.route("/qos-events/<string:event_id>", methods=["DELETE"])
@jwt_required
@role_required(["admin"])
def delete_qos_event(event_id):
    # Delete QoS event by ID
    results = qos_events.delete_one({"_id": event_id})

    # Check if deletion was successful
    if results.deleted_count == 1:
        return make_response(jsonify({"message": "QoS event deleted"}), 200)
    else:
        # Return 404 if event not found
        return make_response(jsonify({"message": "QoS event not found"}), 404)
