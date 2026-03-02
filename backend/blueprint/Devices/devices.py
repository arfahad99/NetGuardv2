from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required, role_required

# Database connection
import globals

devices = globals.db.devices

# Create Blueprint for devices routes
devices_bp = Blueprint("devices_bp", __name__)


# Get all devices with pagination - all authenticated users can view
@devices_bp.route("/devices", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_all_devices():
    data_to_return = []
    # Get pagination parameters from query string with defaults
    page_num = request.args.get("pn", default=1, type=int)
    page_size = request.args.get("ps", default=10, type=int)
    page_start = (page_num - 1) * page_size

    try:
        # Fetch devices from database with pagination
        devices_cursor = devices.find().skip(page_start).limit(page_size)

        # Loop through each device and prepare for JSON serialization
        for device in devices_cursor:
            # Convert ObjectId to string for JSON serialization
            device["_id"] = str(device["_id"])
            data_to_return.append(device)

        # Return success response with devices
        return make_response(jsonify(data_to_return), 200)

    except ConnectionError:
        # Handle database connection errors
        return make_response(jsonify({"error": "Database connection error"}), 500)

    except Exception as e:
        # Handle any other unexpected errors
        return make_response(
            jsonify({"error": "Internal Server Error", "details": str(e)}), 500
        )


# Get single device by ID - all authenticated users can view
@devices_bp.route("/devices/<string:device_id>", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_one_device(device_id):
    # Find single device by ID in database
    device = devices.find_one({"_id": device_id})

    # Check if device exists
    if device is not None:
        # Convert ObjectId to string for JSON serialization
        device["_id"] = str(device["_id"])
        # Return device data
        return make_response(jsonify(device), 200)
    else:
        # Return 404 if device not found
        return make_response(jsonify({"Error": "Device not found"}), 404)


# Create new device - admin and user only (guest cannot create)
@devices_bp.route("/devices", methods=["POST"])
@jwt_required
@role_required(["admin", "user"])
def add_device():
    # Get form data from request
    data = request.form

    # Validate required fields are present
    if data and "name" in data and "type" in data:
        # Create network interfaces list
        interfaces = []

        # Parse interface data (supports multiple interfaces)
        interface_count = 0
        while f"interface_{interface_count}_name" in data:
            interface = {
                "name": data.get(f"interface_{interface_count}_name", ""),
                "ip_address": data.get(f"interface_{interface_count}_ip_address", ""),
                "mac_address": data.get(f"interface_{interface_count}_mac_address", ""),
            }
            # Add vendor if provided
            if data.get(f"interface_{interface_count}_vendor"):
                interface["vendor"] = data.get(f"interface_{interface_count}_vendor")

            interfaces.append(interface)
            interface_count += 1

        # If no indexed interfaces, try to create at least one from default fields
        if not interfaces and data.get("interface_name"):
            interface = {
                "name": data.get("interface_name", ""),
                "ip_address": data.get("interface_ip_address", ""),
                "mac_address": data.get("interface_mac_address", ""),
            }
            if data.get("interface_vendor"):
                interface["vendor"] = data.get("interface_vendor")
            interfaces.append(interface)

        # Create new device object with all fields
        new_device = {
            "name": data.get("name"),
            "type": data.get("type"),
            # Network information
            "network": {
                "interfaces": interfaces,
                "primary_ip": data.get("primary_ip", ""),
            },
            # Status information
            "status": {
                "state": data.get("status_state", "online"),
                "last_seen": int(data.get("last_seen", 0)),
                "created_at": int(data.get("created_at", 0)),
            },
            # System information
            "system": {
                "os": data.get("os", ""),
                "uptime_hours": float(data.get("uptime_hours", 0)),
                "owner": {
                    "department": data.get("department", ""),
                    "assigned_user": data.get("assigned_user", ""),
                },
            },
        }

        # Insert new device into database
        results = devices.insert_one(new_device)
        new_device_id = str(results.inserted_id)
        # Create URL for newly created device
        new_device_link = f"http://127.0.0.1:5001/devices/{new_device_id}"
        return make_response(
            jsonify(
                {
                    "message": "Device created successfully",
                    "device_id": new_device_id,
                    "URL": new_device_link,
                }
            ),
            201,
        )
    else:
        # Return error if required fields missing
        return make_response(
            jsonify({"Error": "Missing required fields: name and type"}), 400
        )


# Update existing device - admin and user only (guest cannot edit)
@devices_bp.route("/devices/<string:device_id>", methods=["PUT"])
@jwt_required
@role_required(["admin", "user"])
def update_device(device_id):
    # Get form data from request
    data = request.form
    update_field = {}

    # Check top-level fields and add to update object if present
    if data.get("name"):
        update_field["name"] = data.get("name")
    if data.get("type"):
        update_field["type"] = data.get("type")

    # Update nested network fields
    if data.get("primary_ip"):
        update_field["network.primary_ip"] = data.get("primary_ip")

    # Update network interfaces (if provided as a complete replacement)
    # Note: For complex nested array updates, consider separate endpoint or full replacement
    interface_count = 0
    interfaces_update = []
    while f"interface_{interface_count}_name" in data:
        interface = {
            "name": data.get(f"interface_{interface_count}_name", ""),
            "ip_address": data.get(f"interface_{interface_count}_ip_address", ""),
            "mac_address": data.get(f"interface_{interface_count}_mac_address", ""),
        }
        if data.get(f"interface_{interface_count}_vendor"):
            interface["vendor"] = data.get(f"interface_{interface_count}_vendor")

        interfaces_update.append(interface)
        interface_count += 1

    if interfaces_update:
        update_field["network.interfaces"] = interfaces_update

    # Update nested status fields
    if data.get("status_state"):
        update_field["status.state"] = data.get("status_state")
    if data.get("last_seen"):
        update_field["status.last_seen"] = int(data.get("last_seen"))
    if data.get("created_at"):
        update_field["status.created_at"] = int(data.get("created_at"))

    # Update nested system fields
    if data.get("os"):
        update_field["system.os"] = data.get("os")
    if data.get("uptime_hours"):
        update_field["system.uptime_hours"] = float(data.get("uptime_hours"))

    # Update nested system owner fields
    if data.get("department"):
        update_field["system.owner.department"] = data.get("department")
    if data.get("assigned_user"):
        update_field["system.owner.assigned_user"] = data.get("assigned_user")

    # Check if there are fields to update
    if not update_field:
        return make_response(jsonify({"Error": "No valid data passed"}), 400)

    # Update device in database
    results = devices.update_one({"_id": device_id}, {"$set": update_field})

    # Check if update was successful
    if results.modified_count == 1:
        # Create URL for updated device
        updated_device_link = f"http://127.0.0.1:5001/devices/{device_id}"
        return make_response(
            jsonify(
                {
                    "message": "Device updated successfully",
                    "device_id": device_id,
                    "URL": updated_device_link,
                }
            ),
            200,
        )
    else:
        # Return 404 if no changes made
        return make_response(jsonify({"message": "No changes made"}), 404)


# Delete device by ID - admin only
@devices_bp.route("/devices/<string:device_id>", methods=["DELETE"])
@jwt_required
@role_required(["admin"])
def delete_device(device_id):
    # Delete device by ID
    results = devices.delete_one({"_id": device_id})

    # Check if deletion was successful
    if results.deleted_count == 1:
        return make_response(jsonify({"message": "Device deleted"}), 200)
    else:
        # Return 404 if device not found
        return make_response(jsonify({"message": "Device not found"}), 404)
