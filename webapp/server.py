import os, time
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS

app = Flask(__name__, static_folder='webapp')
CORS(app)

# API key - set as environment variable on Render / locally for protection
API_KEY = os.environ.get('SMART_HELMET_API_KEY', 'CHANGE_THIS_KEY')

# Live data store (memory). For production use DB.
data_store = {
    "helmet": 1,
    "alcohol": 0,
    "accident": 0,
    "lat": 0.0,
    "lng": 0.0,
    "engine": 1,
    "timestamp": time.time()
}

# Serve frontend
@app.route('/')
def index():
    return send_from_directory('webapp', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('webapp', path)

# Helper: check API key header X-API-KEY
def check_api_key(req):
    key = req.headers.get('X-API-KEY') or req.args.get('api_key')
    return key == API_KEY

# ESP32 POSTs updates to /update (requires X-API-KEY)
@app.route('/update', methods=['POST'])
def update():
    if not check_api_key(request):
        return jsonify({"error":"invalid api key"}), 401
    payload = request.get_json() or {}
    # Accept numeric or string values; do safe casts
    try:
        data_store['helmet'] = int(payload.get('helmet', data_store['helmet']))
        data_store['alcohol'] = int(payload.get('alcohol', data_store['alcohol']))
        data_store['accident'] = int(payload.get('accident', data_store['accident']))
        data_store['lat'] = float(payload.get('lat', data_store['lat']))
        data_store['lng'] = float(payload.get('lng', data_store['lng']))
        data_store['engine'] = int(payload.get('engine', data_store['engine']))
        data_store['timestamp'] = time.time()
    except Exception as e:
        return jsonify({"error":"invalid payload","detail":str(e)}), 400

    # Optional: trigger server-side SMS alerts (non-blocking)
    # if data_store['accident'] == 1:
    #     send_sms_background(...)

    return jsonify({"status":"ok"}), 200

# GET live data for dashboard (no key required)
@app.route('/data', methods=['GET'])
def get_data():
    # return current store as JSON
    return jsonify(data_store)

# optional logs endpoint
@app.route('/logs', methods=['GET'])
def logs():
    return jsonify({"status":"ok","msg":"no logs implemented"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
