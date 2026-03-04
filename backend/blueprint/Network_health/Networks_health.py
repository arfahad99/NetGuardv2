"""
Network Health blueprint for accessing network performance metrics.
Supports retrieving, adding, and updating network health records.
"""
from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required, role_required

# Database connection
import globals

network_health = globals.db.network_health

# Create Blueprint for network health routes
network_health_bp = Blueprint("network_health_bp", __name__)


# Get all network health records with pagination - requires JWT auth
@network_health_bp.route("/network-health", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_all_network_health():
    data_to_return = []
    # Get pagination parameters from query string with defaults
    page_num = request.args.get("pn", default=1, type=int)
    page_size = request.args.get("ps", default=10, type=int)
    page_start = (page_num - 1) * page_size

    try:
        # Fetch network health records from database with pagination
        health_cursor = network_health.find().skip(page_start).limit(page_size)

        # Loop through each record and prepare for JSON serialization
        for record in health_cursor:
            # Convert ObjectId to string for JSON serialization
            record["_id"] = str(record["_id"])
            data_to_return.append(record)

        # Return success response with network health records
        return make_response(jsonify(data_to_return), 200)

    except ConnectionError:
        # Handle database connection errors
        return make_response(jsonify({"error": "Database connection error"}), 500)

    except Exception as e:
        # Handle any other unexpected errors
        return make_response(
            jsonify({"error": "Internal Server Error", "details": str(e)}), 500
        )


# Get single network health record by ID - requires JWT auth
@network_health_bp.route("/network-health/<string:record_id>", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_one_network_health(record_id):
    # Find single network health record by ID in database
    record = network_health.find_one({"_id": record_id})

    # Check if record exists
    if record is not None:
        # Convert ObjectId to string for JSON serialization
        record["_id"] = str(record["_id"])
        # Return record data
        return make_response(jsonify(record), 200)
    else:
        # Return 404 if record not found
        return make_response(
            jsonify({"Error": "Network health record not found"}), 404
        )


# Create new network health record - requires site and interface
@network_health_bp.route("/network-health", methods=["POST"])
@jwt_required
@role_required(["admin", "user"])
def add_network_health():
    # Get form data from request
    data = request.form

    # Validate required fields are present
    if data and "site" in data and "interface" in data:
        # Create new network health record object with all fields
        new_record = {
            # Timestamp information
            "timestamps": {
                "observed_at": int(data.get("observed_at", 0)),
                "created_at": int(data.get("created_at", 0)),
            },
            # Metrics information
            "metrics": {
                "bandwidth": {
                    "upload_mbps": float(data.get("upload_mbps", 0)),
                    "download_mbps": float(data.get("download_mbps", 0)),
                },
                "latency_ms": float(data.get("latency_ms", 0)),
                "packet_loss_percent": float(data.get("packet_loss_percent", 0)),
                "uptime_percent": float(data.get("uptime_percent", 0)),
                "connected_devices": int(data.get("connected_devices", 0)),
            },
            # Context information
            "context": {"site": data.get("site"), "interface": data.get("interface")},
        }

        # Insert new network health record into database
        results = network_health.insert_one(new_record)
        new_record_id = str(results.inserted_id)
        # Create URL for newly created record
        new_record_link = f"http://127.0.0.1:5001/network-health/{new_record_id}"
        return make_response(
            jsonify(
                {
                    "message": "Network health record Added",
                    "record_id": new_record_id,
                    "URL": new_record_link,
                }
            ),
            201,
        )  # Using 201 Created for POST success
    else:
        # Return error if required fields missing
        return make_response(
            jsonify({"Error": "Missing required fields: site and interface"}), 400
        )


# Update existing network health record - partial updates supported
@network_health_bp.route("/network-health/<string:record_id>", methods=["PUT"])
@jwt_required
@role_required(["admin", "user"])
def update_network_health(record_id):
    # Get form data from request
    data = request.form
    update_field = {}

    # Update nested timestamp fields
    if data.get("observed_at"):
        update_field["timestamps.observed_at"] = int(data.get("observed_at"))
    if data.get("created_at"):
        update_field["timestamps.created_at"] = int(data.get("created_at"))

    # Update nested bandwidth metrics fields
    if data.get("upload_mbps"):
        update_field["metrics.bandwidth.upload_mbps"] = float(data.get("upload_mbps"))
    if data.get("download_mbps"):
        update_field["metrics.bandwidth.download_mbps"] = float(
            data.get("download_mbps")
        )

    # Update other metrics fields
    if data.get("latency_ms"):
        update_field["metrics.latency_ms"] = float(data.get("latency_ms"))
    if data.get("packet_loss_percent"):
        update_field["metrics.packet_loss_percent"] = float(
            data.get("packet_loss_percent")
        )
    if data.get("uptime_percent"):
        update_field["metrics.uptime_percent"] = float(data.get("uptime_percent"))
    if data.get("connected_devices"):
        update_field["metrics.connected_devices"] = int(data.get("connected_devices"))

    # Update nested context fields
    if data.get("site"):
        update_field["context.site"] = data.get("site")
    if data.get("interface"):
        update_field["context.interface"] = data.get("interface")

    # Check if there are fields to update
    if not update_field:
        return make_response(jsonify({"Error": "No valid data passed"}), 400)

    # Update network health record in database
    results = network_health.update_one(
        {"_id": record_id}, {"$set": update_field}
    )

    # Check if update was successful
    if results.modified_count == 1:
        # Create URL for updated record
        updated_record_link = f"http://127.0.0.1:5001/network-health/{record_id}"
        return make_response(
            jsonify(
                {
                    "message": "Network health record updated",
                    "record_id": record_id,
                    "URL": updated_record_link,
                }
            ),
            200,
        )
    else:
        # Return 404 if no changes made
        return make_response(jsonify({"message": "No changes made"}), 404)


# Delete network health record by ID - requires JWT auth
@network_health_bp.route("/network-health/<string:record_id>", methods=["DELETE"])
@jwt_required
@role_required(["admin"])
def delete_network_health(record_id):
    # Delete network health record by ID
    results = network_health.delete_one({"_id": record_id})

    # Check if deletion was successful
    if results.deleted_count == 1:
        return make_response(
            jsonify({"message": "Network health record deleted"}), 200
        )
    else:
        # Return 404 if record not found
        return make_response(
            jsonify({"message": "Network health record not found"}), 404
        )
