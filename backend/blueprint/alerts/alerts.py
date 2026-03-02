from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required, role_required

# Database connection
import globals

alerts = globals.db.alerts

alerts_bp = Blueprint("alerts_bp", __name__)


@alerts_bp.route("/alerts", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_all_alerts():
    data_to_return = []
    # Get pagination parameters from query string
    page_num = request.args.get("pn", default=1, type=int)
    page_size = request.args.get("ps", default=10, type=int)
    page_start = (page_num - 1) * page_size

    try:
        # Fetch alerts from database with pagination
        alerts_cursor = alerts.find().skip(page_start).limit(page_size)

        # Loop through each alert
        for alert in alerts_cursor:
            # Convert ObjectId to string for JSON serialization
            alert["_id"] = str(alert["_id"])
            data_to_return.append(alert)

        # Return success response with alerts
        return make_response(jsonify(data_to_return), 200)

    except ConnectionError:
        # Handle database connection errors
        return make_response(jsonify({"error": "Database connection error"}), 500)

    except Exception as e:
        # Handle any other unexpected errors
        return make_response(
            jsonify({"error": "Internal Server Error", "details": str(e)}), 500
        )


@alerts_bp.route("/alerts/<string:alert_id>", methods=["GET"])
@jwt_required
@role_required(["admin", "user", "guest"])
def get_one_alert(alert_id):
    # Find alert by ID
    alert = alerts.find_one({"_id": alert_id})

    if alert is not None:
        # Convert ObjectId to string
        alert["_id"] = str(alert["_id"])
        return make_response(jsonify(alert), 200)
    else:
        return make_response(jsonify({"Error": "Alert not found"}), 404)


@alerts_bp.route("/alerts", methods=["POST"])
@jwt_required
@role_required(["admin", "user"])
def add_alert():
    data = request.form

    # Validate required fields
    if data and "type" in data and "severity" in data and "message" in data:
        # Create new alert object
        new_alert = {
            "type": data.get("type"),
            "severity": data.get("severity"),
            "message": data.get("message"),
            "status": data.get("status", "active"),
            "device": {
                "device_id": int(data.get("device_id", 0)),
                "interface": data.get("interface", "eth0"),
            },
            "timestamps": {"created_at": int(data.get("created_at", 0)), "resolved_at": None},
            "ack": {"acknowledged": False, "by": None, "at": None},
            "source": {
                "rule_id": data.get("rule_id", ""),
                "detector": data.get("detector", ""),
            },
            "labels": data.get("labels", "").split(",") if data.get("labels") else [],
        }

        # Insert new alert
        results = alerts.insert_one(new_alert)
        new_alert_id = str(results.inserted_id)
        new_alert_link = f"http://127.0.0.1:5001/alerts/{new_alert_id}"
        return make_response(
            jsonify(
                {
                    "message": "Alert created successfully",
                    "alert_id": new_alert_id,
                    "URL": new_alert_link,
                }
            ),
            201,
        )
    else:
        return make_response(jsonify({"Error": "Missing required fields"}), 400)


@alerts_bp.route("/alerts/<string:alert_id>", methods=["PUT"])
@jwt_required
@role_required(["admin", "user"])
def update_alert(alert_id):
    data = request.form
    update_field = {}

    # Check and add fields to update
    if data.get("type"):
        update_field["type"] = data.get("type")
    if data.get("severity"):
        update_field["severity"] = data.get("severity")
    if data.get("message"):
        update_field["message"] = data.get("message")
    if data.get("status"):
        update_field["status"] = data.get("status")
    if data.get("device_id"):
        update_field["device.device_id"] = int(data.get("device_id"))
    if data.get("interface"):
        update_field["device.interface"] = data.get("interface")
    if data.get("resolved_at"):
        update_field["timestamps.resolved_at"] = int(data.get("resolved_at"))
    if data.get("acknowledged"):
        update_field["ack.acknowledged"] = data.get("acknowledged") == "true"
    if data.get("ack_by"):
        update_field["ack.by"] = data.get("ack_by")
    if data.get("ack_at"):
        update_field["ack.at"] = int(data.get("ack_at"))

    if not update_field:
        return make_response(jsonify({"Error": "No valid data passed"}), 400)

    # Update alert
    results = alerts.update_one({"_id": alert_id}, {"$set": update_field})

    if results.modified_count == 1:
        updated_alert_link = f"http://127.0.0.1:5001/alerts/{alert_id}"
        return make_response(
            jsonify(
                {
                    "message": "Alert updated successfully",
                    "alert_id": alert_id,
                    "URL": updated_alert_link,
                }
            ),
            200,
        )
    else:
        return make_response(jsonify({"message": "No changes made"}), 404)


@alerts_bp.route("/alerts/<string:alert_id>", methods=["DELETE"])
@jwt_required
@role_required(["admin"])
def delete_alert(alert_id):
    # Delete alert by ID
    results = alerts.delete_one({"_id": alert_id})

    if results.deleted_count == 1:
        return make_response(
            jsonify({"message": "Alert deleted successfully", "alert_id": alert_id}), 200
        )
    else:
        return make_response(
            jsonify({"message": "Alert not found", "alert_id": alert_id}), 404
        )
