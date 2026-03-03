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
    resources={r"/*": {"origins": "*"}},
    supports_credentials=False,
    allow_headers=["Content-Type", "Authorization", "x-access-token", "x-api-key"],
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

# --------------------------------------------------------------------------
# DO I NEED THIS CODE? -> YES!
# WHY? -> The Angular frontend has a "Cloud Health" page that continuously 
# polls this exact '/health' endpoint. If you delete this code, your 
# frontend's Cloud Health page will show the backend and database as "Offline" 
# or completely fail. It's also required by the BackendHealthService in Angular.
# --------------------------------------------------------------------------
@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify backend is running.
    Returns a simple JSON payload with 'status: healthy' if the Flask 
    server is successfully processing requests.
    """
    return jsonify({
        'status': 'healthy',
        'message': 'Backend server is running',
        'timestamp': app.config.get('start_time', 'unknown')
    }), 200

if __name__ == "__main__":
    import time
    app.config['start_time'] = time.time()
    app.run(debug=True, port=5001)
