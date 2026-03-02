from flask import Blueprint, request, jsonify
from globals import measurements_table
from boto3.dynamodb.conditions import Key
from decimal import Decimal
import os, json, datetime

probe_bp = Blueprint('probe', __name__)

# ── Helper: check x-api-key header ─────────────────────────────
def check_api_key():
    key = request.headers.get('x-api-key', '')
    return key == os.getenv('PROBE_API_KEY', '')

# ── Helper: convert floats to Decimal for DynamoDB ──────────────
def to_decimal(obj):
    if isinstance(obj, float): return Decimal(str(obj))
    if isinstance(obj, dict):  return {k: to_decimal(v) for k,v in obj.items()}
    if isinstance(obj, list):  return [to_decimal(i) for i in obj]
    return obj

# ── POST /probe/submit ──────────────────────────────────────────
@probe_bp.route('/submit', methods=['POST'])
def submit():
    if not check_api_key():
        return jsonify({'error': 'Invalid API key'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON body'}), 400

    # Required fields check
    required = ['deviceId','timestamp','latencyMs','packetLoss',
                'downloadMbps','uploadMbps','uptimeStatus']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    # Threshold evaluation
    alert = (
        data['latencyMs']    > float(os.getenv('LATENCY_THRESHOLD_MS',   100)) or
        data['packetLoss']   > float(os.getenv('PACKETLOSS_THRESHOLD_PCT', 1.0)) or
        data['downloadMbps'] < float(os.getenv('BANDWIDTH_THRESHOLD_MBPS', 10))
    )
    data['alertFlag'] = alert

    # Store in DynamoDB (floats must be Decimal)
    item = to_decimal(data)
    measurements_table.put_item(Item=item)

    return jsonify({'status': 'success', 'alert': alert}), 201

# ── GET /probe/latest/<deviceId> ────────────────────────────────
@probe_bp.route('/latest/<device_id>', methods=['GET'])
def latest(device_id):
    if not check_api_key():
        return jsonify({'error': 'Invalid API key'}), 403

    resp = measurements_table.query(
        KeyConditionExpression = Key('deviceId').eq(device_id),
        ScanIndexForward = False,   # newest first
        Limit = 1
    )
    items = resp.get('Items', [])
    if not items:
        return jsonify({'error': 'No data for device'}), 404
    return jsonify(json.loads(json.dumps(items[0], default=str))), 200

# ── GET /probe/history/<deviceId>?start=ISO&end=ISO ─────────────
@probe_bp.route('/history/<device_id>', methods=['GET'])
def history(device_id):
    if not check_api_key():
        return jsonify({'error': 'Invalid API key'}), 403

    start = request.args.get('start', '')
    end   = request.args.get('end',   '')

    if start and end:
        resp = measurements_table.query(
            KeyConditionExpression =
                Key('deviceId').eq(device_id) &
                Key('timestamp').between(start, end),
            ScanIndexForward = True
        )
    else:
        resp = measurements_table.query(
            KeyConditionExpression = Key('deviceId').eq(device_id),
            ScanIndexForward = True,
            Limit = 100
        )

    items = resp.get('Items', [])
    return jsonify(json.loads(json.dumps(items, default=str))), 200

# ── GET /probe/devices ──────────────────────────────────────────
@probe_bp.route('/devices', methods=['GET'])
def devices():
    if not check_api_key():
        return jsonify({'error': 'Invalid API key'}), 403

    resp  = measurements_table.scan(ProjectionExpression='deviceId')
    ids   = list({item['deviceId'] for item in resp.get('Items', [])})
    return jsonify({'devices': ids}), 200

# ── GET /probe/status/<deviceId> ────────────────────────────────
@probe_bp.route('/status/<device_id>', methods=['GET'])
def status(device_id):
    if not check_api_key():
        return jsonify({'error': 'Invalid API key'}), 403

    resp  = measurements_table.query(
        KeyConditionExpression = Key('deviceId').eq(device_id),
        ScanIndexForward = False, Limit = 1
    )
    items = resp.get('Items', [])
    if not items:
        return jsonify({'status': 'unknown'}), 404

    last  = items[0]
    last_ts = datetime.datetime.fromisoformat(last['timestamp'].replace('Z',''))
    age_s = (datetime.datetime.utcnow() - last_ts).total_seconds()
    online = last.get('uptimeStatus') == 'online' and age_s < 120
    return jsonify({'deviceId': device_id, 'online': online, 'lastSeen': last['timestamp']}), 200
