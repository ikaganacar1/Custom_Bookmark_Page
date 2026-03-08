from flask import Flask, jsonify, send_from_directory, request
import json
import os
import socket
import secrets
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__, static_folder='static')

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'favorites.json')

_data_lock = threading.Lock()

KNOWN_PORTS = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 465: 'SMTPS',
    587: 'SMTP', 993: 'IMAPS', 995: 'POP3S', 1433: 'MSSQL', 1521: 'Oracle',
    2375: 'Docker', 2376: 'Docker TLS', 3000: 'Dev Server', 3306: 'MySQL',
    4200: 'Angular', 5000: 'Flask', 5173: 'Vite', 5432: 'PostgreSQL',
    5672: 'RabbitMQ', 6379: 'Redis', 6443: 'Kubernetes', 7474: 'Neo4j',
    8000: 'HTTP Alt', 8080: 'HTTP Alt', 8081: 'HTTP Alt', 8443: 'HTTPS Alt',
    8888: 'Jupyter', 9000: 'Dev Server', 9090: 'Prometheus', 9200: 'Elasticsearch',
    11211: 'Memcached', 15672: 'RabbitMQ UI', 27017: 'MongoDB', 50000: 'Jenkins',
}

# ── Data helpers ─────────────────────────────────────────────────────────────

def load_data():
    if not os.path.exists(DATA_FILE):
        return {'groups': [], 'bookmarks': []}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    import tempfile
    dir_name = os.path.dirname(DATA_FILE)
    with tempfile.NamedTemporaryFile('w', dir=dir_name, delete=False, suffix='.tmp') as f:
        json.dump(data, f, indent=2)
        tmp_path = f.name
    os.replace(tmp_path, DATA_FILE)

def require_json():
    data = request.json
    if data is None:
        from flask import abort
        abort(400)
    return data

# ── Static routes ─────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/style.css')
def serve_css():
    return send_from_directory('static', 'style.css')

@app.route('/script.js')
def serve_js():
    return send_from_directory('static', 'script.js')

# ── Scanner ───────────────────────────────────────────────────────────────────

def scan_port(port, timeout=0.1):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.settimeout(timeout)
        result = sock.connect_ex(('127.0.0.1', port))
        return result == 0
    except Exception:
        return False
    finally:
        sock.close()

def identify_service(port):
    if port in KNOWN_PORTS:
        return KNOWN_PORTS[port]
    try:
        return socket.getservbyport(port)
    except Exception:
        return 'Unknown'

@app.route('/api/scanner', methods=['GET'])
def scan_ports():
    start_port = request.args.get('start', 1, type=int)
    end_port = request.args.get('end', 100, type=int)
    end_port = min(end_port, start_port + 499)
    active_services = []
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {executor.submit(scan_port, port): port
                   for port in range(start_port, end_port + 1)}
        for future in as_completed(futures):
            port = futures[future]
            try:
                if future.result():
                    active_services.append({
                        'port': port,
                        'service': identify_service(port)
                    })
            except Exception:
                pass
    active_services.sort(key=lambda x: x['port'])
    return jsonify(active_services)

# ── Groups ────────────────────────────────────────────────────────────────────

@app.route('/api/groups', methods=['GET'])
def get_groups():
    return jsonify(load_data()['groups'])

@app.route('/api/groups', methods=['POST'])
def create_group():
    body = require_json()
    with _data_lock:
        data = load_data()
        group = {
            'id': secrets.token_hex(4),
            'name': body['name'],
            'color': body.get('color', '#95a5a6'),
        }
        data['groups'].append(group)
        save_data(data)
    return jsonify(group), 201

@app.route('/api/groups/<gid>', methods=['PUT'])
def update_group(gid):
    body = require_json()
    with _data_lock:
        data = load_data()
        for g in data['groups']:
            if g['id'] == gid:
                if 'name' in body:
                    g['name'] = body['name']
                if 'color' in body:
                    g['color'] = body['color']
                save_data(data)
                return jsonify(g)
    return jsonify({'error': 'not found'}), 404

@app.route('/api/groups/<gid>', methods=['DELETE'])
def delete_group(gid):
    with _data_lock:
        data = load_data()
        data['groups'] = [g for g in data['groups'] if g['id'] != gid]
        for b in data['bookmarks']:
            if b.get('group') == gid:
                b['group'] = None
        save_data(data)
    return jsonify({'ok': True})

# ── Bookmarks ─────────────────────────────────────────────────────────────────

@app.route('/api/bookmarks', methods=['GET'])
def get_bookmarks():
    return jsonify(load_data()['bookmarks'])

@app.route('/api/bookmarks', methods=['POST'])
def create_bookmark():
    body = require_json()
    with _data_lock:
        data = load_data()
        bookmark = {
            'id': secrets.token_hex(4),
            'name': body.get('name', ''),
            'url': body.get('url') or None,
            'port': body.get('port') or None,
            'icon': body.get('icon') or None,
            'group': body.get('group') or None,
        }
        data['bookmarks'].append(bookmark)
        save_data(data)
    return jsonify(bookmark), 201

@app.route('/api/bookmarks/<bid>', methods=['PUT'])
def update_bookmark(bid):
    body = require_json()
    with _data_lock:
        data = load_data()
        for b in data['bookmarks']:
            if b['id'] == bid:
                for field in ('name', 'url', 'port', 'icon', 'group'):
                    if field in body:
                        b[field] = body[field] or None
                save_data(data)
                return jsonify(b)
    return jsonify({'error': 'not found'}), 404

@app.route('/api/bookmarks/<bid>', methods=['DELETE'])
def delete_bookmark(bid):
    with _data_lock:
        data = load_data()
        data['bookmarks'] = [b for b in data['bookmarks'] if b['id'] != bid]
        save_data(data)
    return jsonify({'ok': True})

@app.route('/api/bookmarks/reorder', methods=['POST'])
def reorder_bookmarks():
    body = require_json()
    ids = body.get('ids', [])
    if not isinstance(ids, list):
        return jsonify({'error': "'ids' must be a list"}), 400
    with _data_lock:
        data = load_data()
        bm_map = {b['id']: b for b in data['bookmarks']}
        ids_set = set(ids)
        ordered = [bm_map[i] for i in ids if i in bm_map]
        remaining = [b for b in data['bookmarks'] if b['id'] not in ids_set]
        data['bookmarks'] = ordered + remaining
        save_data(data)
    return jsonify({'ok': True})

def migrate_if_needed():
    if not os.path.exists(DATA_FILE):
        return
    with open(DATA_FILE, 'r') as f:
        try:
            data = json.load(f)
        except Exception:
            return
    if isinstance(data, list):
        new_data = {
            'groups': [],
            'bookmarks': [
                {
                    'id': secrets.token_hex(4),
                    'name': item.get('service') or f"Port {item['port']}",
                    'url': None,
                    'port': item['port'],
                    'icon': None,
                    'group': None,
                }
                for item in data
            ]
        }
        save_data(new_data)

migrate_if_needed()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
