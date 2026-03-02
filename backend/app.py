from flask import Flask, jsonify
from flask_cors import CORS
# blueprints
from blueprint.auth.auth import auth_bp
from blueprint.qosevent.qosevent import qos_events_bp
from blueprint.alerts.alerts import alerts_bp
from blueprint.Devices.devices import devices_bp
from blueprint.sessions.sessions import sessions_bp
from blueprint.Network_health.Networks_health import network_health_bp
from blueprint.users.users import users_bp
from blueprint.probe.routes import probe_bp


app = Flask(__name__)
# Enable CORS for Angular frontend (allow common development ports)
CORS(
    app,
    resources={r"/*": {"origins": [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:50507",
        "http://127.0.0.1:50507",
        "http://localhost:*",
        "http://127.0.0.1:*"
    ]}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "x-access-token"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(qos_events_bp)
app.register_blueprint(alerts_bp)
app.register_blueprint(devices_bp)
app.register_blueprint(sessions_bp)
app.register_blueprint(network_health_bp)
app.register_blueprint(users_bp)
app.register_blueprint(probe_bp, url_prefix='/probe')

# Health check endpoint for frontend dependency
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend is running"""
    return jsonify({
        'status': 'healthy',
        'message': 'Backend server is running',
        'timestamp': app.config.get('start_time', 'unknown')
    }), 200

if __name__ == "__main__":
    import time
    app.config['start_time'] = time.time()
    app.run(debug=True, port=5001)
