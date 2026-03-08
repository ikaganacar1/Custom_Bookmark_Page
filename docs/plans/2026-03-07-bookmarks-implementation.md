# Bookmarks Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the app into a full browser landing page with bookmarks (port or URL), Nerd Font icons, color-coded groups, and a Settings tab for manual management.

**Architecture:** Data model in `favorites.json` migrates from a flat array to `{groups, bookmarks}`. Flask gains CRUD endpoints for both resources. Frontend gains three tabs (Dashboard/Scan/Settings), a group filter bar, an icon picker backed by locally-served Nerd Fonts, and modals for add/edit flows.

**Tech Stack:** Python Flask, `concurrent.futures`, Vanilla JS (async/await), CSS custom properties, NerdFontsSymbolsOnly font (served locally)

---

## Task 1: Download Nerd Fonts and update Dockerfile

**Files:**
- Modify: `Dockerfile`
- Create: `static/fonts/` directory (via Docker build)

**Step 1: Update Dockerfile**

Replace the entire `Dockerfile` with:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN pip install flask

# Download Nerd Fonts Symbols Only (icon font, ~1MB)
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/* && \
    curl -fsSL "https://github.com/ryanoasis/nerd-fonts/releases/download/v3.3.0/NerdFontsSymbolsOnly.zip" \
        -o /tmp/nf.zip && \
    mkdir -p static/fonts && \
    unzip -p /tmp/nf.zip "SymbolsNerdFont-Regular.ttf" > static/fonts/SymbolsNerdFont-Regular.ttf && \
    rm /tmp/nf.zip && \
    apt-get purge -y curl unzip && apt-get autoremove -y

COPY app.py .
COPY static/ static/
RUN mkdir -p data

EXPOSE 5000

CMD ["python", "app.py"]
```

**Step 2: Verify syntax**

```bash
cd /mnt/2tb_ssd/local_claudecode/pixel_art_launcher && cat Dockerfile
```
Expected: file shows the new content with the curl/unzip block.

**Step 3: Commit**

```bash
cd /mnt/2tb_ssd/local_claudecode && git add pixel_art_launcher/Dockerfile
git commit -m "build: download NerdFontsSymbolsOnly at Docker build time"
```

---

## Task 2: Rewrite app.py — new data model, migration, CRUD endpoints

**Files:**
- Modify: `pixel_art_launcher/app.py`

**Step 1: Replace app.py entirely**

```python
from flask import Flask, jsonify, send_from_directory, request
import json
import os
import socket
import secrets
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__, static_folder='static')

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'favorites.json')

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
        data = json.load(f)
    # Migrate old array format (previous favorites)
    if isinstance(data, list):
        data = {
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
        save_data(data)
    return data

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

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
    body = request.json
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
    body = request.json
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
    body = request.json
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
    body = request.json
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
    data = load_data()
    data['bookmarks'] = [b for b in data['bookmarks'] if b['id'] != bid]
    save_data(data)
    return jsonify({'ok': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

**Step 2: Verify syntax**

```bash
cd /mnt/2tb_ssd/local_claudecode/pixel_art_launcher && python -c "import ast; ast.parse(open('app.py').read()); print('OK')"
```
Expected: `OK`

**Step 3: Commit**

```bash
cd /mnt/2tb_ssd/local_claudecode && git add pixel_art_launcher/app.py
git commit -m "feat: new data model — bookmarks + groups CRUD, migration from old favorites format"
```

---

## Task 3: Rewrite index.html — three tabs, all page structure

**Files:**
- Modify: `pixel_art_launcher/static/index.html`

**Step 1: Replace index.html entirely**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pixel Art Launcher</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <nav class="pixel-nav">
            <button id="nav-dashboard" class="active">Dashboard</button>
            <button id="nav-scan">Scan</button>
            <button id="nav-settings">Settings</button>
        </nav>

        <!-- ── Dashboard ───────────────────────────────────── -->
        <div id="view-dashboard" class="view active">
            <div id="group-filter" class="group-filter">
                <button class="group-pill active" data-group="all">All</button>
            </div>
            <div id="bookmarks-grid" class="pixel-grid"></div>
        </div>

        <!-- ── Scan ────────────────────────────────────────── -->
        <div id="view-scan" class="view">
            <h1>Scan Local Ports</h1>
            <div class="scan-controls">
                <div class="scan-presets">
                    <button class="preset-btn" data-end="1000">Common (1–1000)</button>
                    <button class="preset-btn" data-end="49151">All Ports</button>
                    <button class="preset-btn" data-custom="true">Custom</button>
                </div>
                <div id="custom-range-inputs" class="custom-range hidden">
                    <input type="number" id="scan-start" placeholder="Start" min="1" max="65535" value="1">
                    <span>–</span>
                    <input type="number" id="scan-end" placeholder="End" min="1" max="65535" value="9999">
                    <button id="btn-scan-custom">Scan</button>
                </div>
                <div class="scan-actions">
                    <button id="btn-scan-default">Scan Ports 1–1000</button>
                    <button id="btn-stop-scan" class="hidden">Stop</button>
                </div>
            </div>
            <div id="scan-progress-area" class="hidden">
                <div class="progress-label">
                    <span id="progress-text">Scanning…</span>
                    <span id="progress-count"></span>
                </div>
                <div class="progress-bar-outer">
                    <div id="progress-bar-inner" class="progress-bar-inner"></div>
                </div>
            </div>
            <div id="scan-results" class="pixel-grid"></div>
        </div>

        <!-- ── Settings ────────────────────────────────────── -->
        <div id="view-settings" class="view">
            <h1>Settings</h1>

            <section class="settings-section">
                <h2>Groups</h2>
                <div id="groups-list" class="groups-list"></div>
                <form id="form-add-group" class="settings-form inline-form">
                    <input type="text" id="group-name" placeholder="Group name" required>
                    <input type="color" id="group-color" value="#27ae60">
                    <button type="submit">Add Group</button>
                </form>
            </section>

            <section class="settings-section">
                <h2>Add Bookmark</h2>
                <form id="form-add-bookmark" class="settings-form">
                    <input type="text" id="bm-name" placeholder="Name" required>
                    <div class="type-toggle">
                        <label><input type="radio" name="bm-type" value="port" checked> Port</label>
                        <label><input type="radio" name="bm-type" value="url"> URL</label>
                    </div>
                    <input type="number" id="bm-port" placeholder="Port number" min="1" max="65535">
                    <input type="text" id="bm-url" placeholder="https://example.com" class="hidden">
                    <div class="icon-picker-wrap">
                        <label>Icon</label>
                        <input type="text" id="bm-icon-search" placeholder="Search icon…" autocomplete="off">
                        <input type="hidden" id="bm-icon">
                        <div id="bm-icon-grid" class="icon-grid"></div>
                    </div>
                    <select id="bm-group">
                        <option value="">No group</option>
                    </select>
                    <button type="submit">Add Bookmark</button>
                </form>
            </section>

            <section class="settings-section">
                <h2>All Bookmarks</h2>
                <div id="bookmarks-table"></div>
            </section>
        </div>
    </div>

    <!-- Edit Bookmark Modal -->
    <div id="edit-modal" class="modal hidden">
        <div class="modal-box">
            <h2>Edit Bookmark</h2>
            <form id="form-edit-bookmark" class="settings-form">
                <input type="hidden" id="edit-bm-id">
                <input type="text" id="edit-bm-name" placeholder="Name" required>
                <div class="type-toggle">
                    <label><input type="radio" name="edit-bm-type" value="port" checked> Port</label>
                    <label><input type="radio" name="edit-bm-type" value="url"> URL</label>
                </div>
                <input type="number" id="edit-bm-port" placeholder="Port number" min="1" max="65535">
                <input type="text" id="edit-bm-url" placeholder="https://example.com" class="hidden">
                <div class="icon-picker-wrap">
                    <label>Icon</label>
                    <input type="text" id="edit-icon-search" placeholder="Search icon…" autocomplete="off">
                    <input type="hidden" id="edit-bm-icon">
                    <div id="edit-icon-grid" class="icon-grid"></div>
                </div>
                <select id="edit-bm-group">
                    <option value="">No group</option>
                </select>
                <div class="modal-actions">
                    <button type="submit">Save</button>
                    <button type="button" id="btn-cancel-edit">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Scan → Add to Dashboard Modal -->
    <div id="scan-add-modal" class="modal hidden">
        <div class="modal-box">
            <h2>Add to Dashboard</h2>
            <form id="form-scan-add" class="settings-form">
                <input type="hidden" id="scan-add-port">
                <input type="text" id="scan-add-name" placeholder="Name" required>
                <div class="icon-picker-wrap">
                    <label>Icon</label>
                    <input type="text" id="scan-add-icon-search" placeholder="Search icon…" autocomplete="off">
                    <input type="hidden" id="scan-add-icon">
                    <div id="scan-add-icon-grid" class="icon-grid"></div>
                </div>
                <select id="scan-add-group">
                    <option value="">No group</option>
                </select>
                <div class="modal-actions">
                    <button type="submit">Add</button>
                    <button type="button" id="btn-cancel-scan-add">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

**Step 2: Commit**

```bash
cd /mnt/2tb_ssd/local_claudecode && git add pixel_art_launcher/static/index.html
git commit -m "html: three tabs, group filter bar, settings page, bookmark/scan modals"
```

---

## Task 4: Rewrite style.css — Nerd Fonts, groups, icon picker, modals, settings

**Files:**
- Modify: `pixel_art_launcher/static/style.css`

**Step 1: Replace style.css entirely**

```css
/* ── Nerd Fonts ─────────────────────────────────────────────────────────── */
@font-face {
    font-family: 'NerdFont';
    src: url('/static/fonts/SymbolsNerdFont-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
}

:root {
    --primary: #2c3e50;
    --accent: #e74c3c;
    --green: #27ae60;
    --blue: #2980b9;
    --yellow: #f39c12;
    --red: #c0392b;
    --grey: #95a5a6;
    --bg: #ecf0f1;
    --text: #2c3e50;
    --card-bg: #ffffff;
}

* { box-sizing: border-box; }

body {
    font-family: 'Courier New', monospace;
    background: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 0;
}

#app {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px;
}

/* ── Nerd Font icon class ────────────────────────────────────────────────── */
.nf {
    font-family: 'NerdFont', monospace;
    font-style: normal;
    line-height: 1;
}

/* ── Navigation ─────────────────────────────────────────────────────────── */
.pixel-nav {
    display: flex;
    border: 4px solid var(--primary);
    background: var(--primary);
    gap: 4px;
    padding: 4px;
}

.pixel-nav button {
    flex: 1;
    background: var(--bg);
    border: none;
    padding: 14px;
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.pixel-nav button.active {
    background: var(--accent);
    color: white;
}

.pixel-nav button:hover:not(.active) {
    background: #bdc3c7;
}

/* ── Views ──────────────────────────────────────────────────────────────── */
.view { display: none; }
.view.active { display: block; }

h1 {
    text-align: center;
    margin: 24px 0 20px;
    color: var(--primary);
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 2px;
}

/* ── Group Filter Bar ───────────────────────────────────────────────────── */
.group-filter {
    display: flex;
    gap: 8px;
    padding: 16px 0 12px;
    flex-wrap: wrap;
}

.group-pill {
    padding: 6px 16px;
    border: 3px solid var(--primary);
    background: var(--card-bg);
    font-family: inherit;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 2px 2px 0 var(--primary);
    transition: transform 0.1s, box-shadow 0.1s;
}

.group-pill:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--primary);
}

.group-pill.active {
    color: white;
    /* background set inline via JS using group color */
}

/* ── Scan Controls ──────────────────────────────────────────────────────── */
.scan-controls {
    text-align: center;
    margin: 0 0 20px;
}

.scan-presets {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;
    justify-content: center;
}

.preset-btn {
    padding: 10px 18px;
    cursor: pointer;
    background: var(--card-bg);
    border: 3px solid var(--primary);
    font-family: inherit;
    font-weight: bold;
    font-size: 12px;
    box-shadow: 3px 3px 0 var(--primary);
    transition: transform 0.1s, box-shadow 0.1s;
}

.preset-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--primary);
}

.preset-btn.active {
    background: var(--accent);
    color: white;
}

.custom-range {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
    flex-wrap: wrap;
}

.custom-range.hidden { display: none; }

.custom-range span {
    font-weight: bold;
    font-size: 16px;
}

.custom-range input {
    padding: 10px;
    width: 110px;
    border: 3px solid var(--primary);
    font-family: inherit;
    font-size: 12px;
    background: var(--bg);
}

.custom-range input:focus {
    outline: none;
    border-color: var(--accent);
}

.scan-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
}

#btn-scan-default,
#btn-scan-custom {
    padding: 12px 28px;
    cursor: pointer;
    background: var(--accent);
    color: white;
    border: 3px solid var(--primary);
    font-family: inherit;
    font-weight: bold;
    font-size: 13px;
    box-shadow: 3px 3px 0 var(--primary);
    transition: transform 0.1s, box-shadow 0.1s;
}

#btn-scan-default:hover,
#btn-scan-custom:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--primary);
}

#btn-stop-scan {
    padding: 12px 28px;
    cursor: pointer;
    background: var(--grey);
    color: white;
    border: 3px solid var(--primary);
    font-family: inherit;
    font-weight: bold;
    font-size: 13px;
    box-shadow: 3px 3px 0 var(--primary);
    transition: transform 0.1s, box-shadow 0.1s;
}

#btn-stop-scan:hover {
    background: #7f8c8d;
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--primary);
}

.hidden { display: none !important; }

/* ── Progress Bar ───────────────────────────────────────────────────────── */
#scan-progress-area {
    margin: 0 0 20px;
    padding: 0 20px;
}

.progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--primary);
}

.progress-bar-outer {
    border: 3px solid var(--primary);
    background: var(--bg);
    height: 22px;
    box-shadow: 3px 3px 0 var(--primary);
    overflow: hidden;
}

.progress-bar-inner {
    height: 100%;
    width: 0%;
    background: repeating-linear-gradient(
        90deg,
        var(--accent) 0px, var(--accent) 14px,
        #c0392b 14px, #c0392b 16px
    );
    transition: width 0.3s ease;
}

/* ── Grid ───────────────────────────────────────────────────────────────── */
.pixel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 18px;
    padding: 10px 0;
}

/* ── Bookmark Cards ─────────────────────────────────────────────────────── */
.pixel-card {
    border: 3px solid var(--primary);
    background: var(--card-bg);
    padding: 20px 16px 14px;
    text-align: center;
    box-shadow: 4px 4px 0 var(--primary);
    transition: transform 0.1s, box-shadow 0.1s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    animation: fadeInUp 0.25s ease-out;
    border-top: 5px solid var(--grey);
    cursor: default;
}

.pixel-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--primary);
}

.card-icon {
    font-size: 40px;
    margin-bottom: 10px;
    line-height: 1;
}

.pixel-card h3 {
    margin: 0 0 4px;
    color: var(--primary);
    font-size: 13px;
    word-break: break-word;
}

.pixel-card .card-url {
    font-size: 11px;
    color: var(--grey);
    margin: 0 0 12px;
    word-break: break-all;
}

.pixel-card .card-actions {
    display: flex;
    gap: 6px;
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
}

.pixel-card button {
    background: var(--accent);
    color: white;
    border: 2px solid var(--primary);
    padding: 6px 10px;
    font-family: inherit;
    cursor: pointer;
    font-weight: bold;
    font-size: 11px;
    transition: transform 0.1s, box-shadow 0.1s;
}

.pixel-card button:hover {
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 var(--primary);
}

.pixel-card button.remove {
    background: var(--grey);
}

.pixel-card button.remove:hover {
    background: #7f8c8d;
}

/* Scan result cards */
.scan-card {
    border: 3px solid var(--primary);
    background: var(--card-bg);
    padding: 14px;
    text-align: center;
    box-shadow: 4px 4px 0 var(--primary);
    animation: fadeInUp 0.25s ease-out;
    border-left: 6px solid var(--grey);
}

.scan-card h3 { margin: 0 0 4px; font-size: 13px; color: var(--primary); }
.scan-card p  { margin: 0 0 10px; font-size: 11px; color: var(--grey); }

.scan-card button {
    background: var(--accent);
    color: white;
    border: 2px solid var(--primary);
    padding: 6px 12px;
    font-family: inherit;
    cursor: pointer;
    font-weight: bold;
    font-size: 11px;
}

.scan-card button:hover {
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 var(--primary);
}

/* ── Empty State ────────────────────────────────────────────────────────── */
.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
    color: var(--grey);
}

.empty-pixel {
    font-size: 48px;
    margin-bottom: 16px;
    color: var(--primary);
    letter-spacing: 4px;
}

.empty-state p { margin: 4px 0; font-size: 14px; font-weight: bold; }
.empty-hint { font-size: 12px !important; font-weight: normal !important; margin-top: 8px !important; }

/* ── Settings ───────────────────────────────────────────────────────────── */
.settings-section {
    border: 3px solid var(--primary);
    background: var(--card-bg);
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 4px 4px 0 var(--primary);
}

.settings-section h2 {
    margin: 0 0 16px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--primary);
    border-bottom: 2px solid var(--bg);
    padding-bottom: 10px;
}

.settings-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.settings-form input[type="text"],
.settings-form input[type="number"],
.settings-form select {
    padding: 10px;
    border: 3px solid var(--primary);
    font-family: inherit;
    font-size: 12px;
    background: var(--bg);
    width: 100%;
}

.settings-form input:focus,
.settings-form select:focus {
    outline: none;
    border-color: var(--accent);
}

.settings-form button[type="submit"] {
    padding: 10px 20px;
    background: var(--accent);
    color: white;
    border: 3px solid var(--primary);
    font-family: inherit;
    font-weight: bold;
    font-size: 12px;
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--primary);
    align-self: flex-start;
    transition: transform 0.1s, box-shadow 0.1s;
}

.settings-form button[type="submit"]:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--primary);
}

.inline-form {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
}

.inline-form input[type="text"] { flex: 1; min-width: 140px; }

.type-toggle {
    display: flex;
    gap: 16px;
    font-size: 13px;
}

/* Groups list */
.groups-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
}

.group-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 2px solid var(--primary);
    background: var(--bg);
}

.group-swatch {
    width: 20px;
    height: 20px;
    border: 2px solid var(--primary);
    flex-shrink: 0;
}

.group-row span { flex: 1; font-size: 13px; font-weight: bold; }

.group-row button {
    background: var(--grey);
    color: white;
    border: 2px solid var(--primary);
    padding: 4px 8px;
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
    font-weight: bold;
}

.group-row button:hover { background: #7f8c8d; }

/* Bookmarks table */
.bookmarks-table {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.bookmark-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 2px solid var(--primary);
    background: var(--bg);
}

.bookmark-row .bm-icon { font-size: 18px; flex-shrink: 0; width: 24px; text-align: center; }
.bookmark-row .bm-name { flex: 1; font-size: 13px; font-weight: bold; word-break: break-word; }
.bookmark-row .bm-url  { font-size: 11px; color: var(--grey); flex: 1; word-break: break-all; }

.bookmark-row button {
    background: var(--grey);
    color: white;
    border: 2px solid var(--primary);
    padding: 4px 8px;
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
    font-weight: bold;
    flex-shrink: 0;
}

.bookmark-row button.edit-btn { background: var(--blue); }
.bookmark-row button:hover { opacity: 0.85; }

/* ── Icon Picker ────────────────────────────────────────────────────────── */
.icon-picker-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.icon-picker-wrap label {
    font-size: 12px;
    font-weight: bold;
    color: var(--primary);
}

.icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 44px);
    gap: 4px;
    max-height: 200px;
    overflow-y: auto;
    padding: 6px;
    border: 3px solid var(--primary);
    background: var(--bg);
}

.icon-btn {
    width: 40px;
    height: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px solid transparent;
    background: var(--card-bg);
    cursor: pointer;
    font-size: 18px;
    transition: border-color 0.1s;
    padding: 0;
    gap: 2px;
}

.icon-btn:hover { border-color: var(--primary); }
.icon-btn.selected { border-color: var(--accent); background: #fdecea; }
.icon-btn .icon-label { font-size: 8px; color: var(--grey); font-family: 'Courier New', monospace; overflow: hidden; width: 100%; text-align: center; white-space: nowrap; }

/* ── Modals ─────────────────────────────────────────────────────────────── */
.modal {
    position: fixed;
    inset: 0;
    background: rgba(44, 62, 80, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.modal-box {
    background: var(--card-bg);
    border: 4px solid var(--primary);
    box-shadow: 6px 6px 0 var(--primary);
    padding: 24px;
    width: min(480px, 94vw);
    max-height: 90vh;
    overflow-y: auto;
}

.modal-box h2 {
    margin: 0 0 16px;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 6px;
}

.modal-actions button[type="button"] {
    padding: 10px 20px;
    background: var(--grey);
    color: white;
    border: 3px solid var(--primary);
    font-family: inherit;
    font-weight: bold;
    font-size: 12px;
    cursor: pointer;
}

/* ── Animations ─────────────────────────────────────────────────────────── */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 1024px) and (min-width: 769px) {
    #app { max-width: 90%; }
    .pixel-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    .pixel-nav { flex-direction: column; gap: 4px; }
    .pixel-nav button { width: 100%; }
    #app { padding: 12px; }
    .pixel-grid { grid-template-columns: repeat(2, 1fr); }
    .pixel-card { padding: 14px; }
    .bookmark-row .bm-url { display: none; }
}

@media (max-width: 480px) {
    .pixel-grid { grid-template-columns: 1fr; }
}
```

**Step 2: Commit**

```bash
cd /mnt/2tb_ssd/local_claudecode && git add pixel_art_launcher/static/style.css
git commit -m "style: Nerd Fonts, group filter pills, bookmark cards, icon picker, modals, settings"
```

---

## Task 5: Rewrite script.js — icons table, bookmarks, groups, icon picker, settings

**Files:**
- Modify: `pixel_art_launcher/static/script.js`

**Step 1: Replace script.js entirely**

```javascript
// ── Nerd Font icon catalogue (name → Unicode codepoint) ───────────────────
// Uses NerdFontsSymbolsOnly-Regular.ttf (served at /static/fonts/)
const ICONS = {
    // Interface / UI
    'home':        '\uF015',
    'star':        '\uF005',
    'heart':       '\uF004',
    'bookmark':    '\uF02E',
    'link':        '\uF0C1',
    'globe':       '\uF0AC',
    'search':      '\uF002',
    'cog':         '\uF013',
    'cogs':        '\uF085',
    'wrench':      '\uF0AD',
    'lock':        '\uF023',
    'unlock':      '\uF09C',
    'user':        '\uF007',
    'users':       '\uF0C0',
    'bell':        '\uF0F3',
    'flag':        '\uF024',
    'folder':      '\uF07B',
    'file':        '\uF15B',
    'archive':     '\uF187',
    'trash':       '\uF1F8',
    'download':    '\uF019',
    'upload':      '\uF093',
    'refresh':     '\uF021',
    'share':       '\uF064',
    'external':    '\uF08E',
    'rss':         '\uF09E',
    'info':        '\uF05A',
    'bolt':        '\uF0E7',
    'fire':        '\uF06D',
    // Media
    'music':       '\uF001',
    'film':        '\uF008',
    'tv':          '\uF26C',
    'camera':      '\uF030',
    'headphones':  '\uF025',
    'microphone':  '\uF130',
    'image':       '\uF03E',
    'video':       '\uF03D',
    'podcast':     '\uF2CE',
    'play':        '\uF04B',
    // Dev / Tech
    'code':        '\uF121',
    'terminal':    '\uF120',
    'bug':         '\uF188',
    'git':         '\uE702',
    'github':      '\uF09B',
    'gitlab':      '\uF296',
    'docker':      '\uE7B0',
    'kubernetes':  '\uFD31',
    'python':      '\uE73C',
    'nodejs':      '\uE718',
    'react':       '\uE7BA',
    'angular':     '\uE753',
    'linux':       '\uF17C',
    'apple':       '\uF179',
    'windows':     '\uF17A',
    'android':     '\uF17B',
    // Database / Storage
    'database':    '\uF1C0',
    'server':      '\uF233',
    'hdd':         '\uF0A0',
    'cloud':       '\uF0C2',
    'cloud-up':    '\uF0EE',
    'cloud-down':  '\uF0ED',
    'mysql':       '\uE704',
    'postgresql':  '\uE76E',
    'redis':       '\uE76D',
    'mongodb':     '\uE7AE',
    // Network
    'wifi':        '\uF1EB',
    'ethernet':    '\uF6FF',
    'vpn':         '\uF3ED',
    'router':      '\uF0E8',
    'sitemap':     '\uF0E8',
    // Monitoring / Ops
    'chart':       '\uF080',
    'chart-line':  '\uF201',
    'tachometer':  '\uF0E4',
    'dashboard':   '\uF0E4',
    'tasks':       '\uF0AE',
    'list':        '\uF03A',
    // Communication
    'envelope':    '\uF0E0',
    'chat':        '\uF075',
    'comments':    '\uF086',
    'slack':       '\uF198',
    'discord':     '\uFB6E',
    'telegram':    '\uF2C6',
    // Devices
    'desktop':     '\uF108',
    'laptop':      '\uF109',
    'tablet':      '\uF10A',
    'mobile':      '\uF10B',
    'print':       '\uF02F',
    'keyboard':    '\uF11C',
    // Finance / Business
    'money':       '\uF0D6',
    'bitcoin':     '\uF15A',
    'shopping':    '\uF07A',
    'briefcase':   '\uF0B1',
    // Misc
    'calendar':    '\uF073',
    'clock':       '\uF017',
    'map':         '\uF041',
    'book':        '\uF02D',
    'newspaper':   '\uF1EA',
    'gamepad':     '\uF11B',
    'robot':       '\uF544',
    'magic':       '\uF0D0',
    'flask':       '\uF0C3',
    'leaf':        '\uF06C',
    'sun':         '\uF185',
    'moon':        '\uF186',
    'plane':       '\uF072',
    'car':         '\uF1B9',
    'bicycle':     '\uF206',
};

const ICON_NAMES = Object.keys(ICONS);

// ── State ─────────────────────────────────────────────────────────────────
let bookmarks = [];
let groups = [];
let activeGroup = 'all';
let stopRequested = false;

// ── Helpers ───────────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function bookmarkUrl(bm) {
    return bm.url || `http://localhost:${bm.port}`;
}

function renderIcon(iconKey) {
    if (!iconKey || !ICONS[iconKey]) return '<span class="nf card-icon">\uF15B</span>';
    return `<span class="nf card-icon">${ICONS[iconKey]}</span>`;
}

function getGroupColor(groupId) {
    const g = groups.find(g => g.id === groupId);
    return g ? g.color : 'var(--grey)';
}

// ── Navigation ────────────────────────────────────────────────────────────
document.getElementById('nav-dashboard').addEventListener('click', () => switchView('dashboard'));
document.getElementById('nav-scan').addEventListener('click',      () => switchView('scan'));
document.getElementById('nav-settings').addEventListener('click',  () => switchView('settings'));

function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.pixel-nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(`view-${name}`).classList.add('active');
    document.getElementById(`nav-${name}`).classList.add('active');
    if (name === 'settings') renderSettingsPage();
}

// ── Data loading ──────────────────────────────────────────────────────────
async function loadAll() {
    const [bRes, gRes] = await Promise.all([
        fetch('/api/bookmarks'),
        fetch('/api/groups'),
    ]);
    bookmarks = await bRes.json();
    groups    = await gRes.json();
    renderGroupFilter();
    renderBookmarks();
}

// ── Group filter bar ──────────────────────────────────────────────────────
function renderGroupFilter() {
    const bar = document.getElementById('group-filter');
    const allActive = activeGroup === 'all';
    let html = `<button class="group-pill${allActive ? ' active' : ''}" data-group="all"
        style="${allActive ? 'background:var(--accent);border-color:var(--accent)' : ''}">All</button>`;

    groups.forEach(g => {
        const isActive = activeGroup === g.id;
        html += `<button class="group-pill${isActive ? ' active' : ''}" data-group="${escHtml(g.id)}"
            style="${isActive
                ? `background:${g.color};border-color:${g.color}`
                : `border-color:${g.color}`}"
            >${escHtml(g.name)}</button>`;
    });
    bar.innerHTML = html;

    bar.querySelectorAll('.group-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            activeGroup = btn.dataset.group;
            renderGroupFilter();
            renderBookmarks();
        });
    });
}

// ── Dashboard bookmarks ───────────────────────────────────────────────────
function renderBookmarks() {
    const grid = document.getElementById('bookmarks-grid');
    const filtered = activeGroup === 'all'
        ? bookmarks
        : bookmarks.filter(b => b.group === activeGroup);

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state">
            <div class="empty-pixel">[_]</div>
            <p>No bookmarks${activeGroup !== 'all' ? ' in this group' : ''} yet.</p>
            <p class="empty-hint">Add them from Settings or use Scan to discover local services.</p>
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map(bm => {
        const color = getGroupColor(bm.group);
        const url   = escHtml(bookmarkUrl(bm));
        return `<div class="pixel-card" style="border-top-color:${color}">
            ${renderIcon(bm.icon)}
            <h3>${escHtml(bm.name)}</h3>
            <p class="card-url">${url}</p>
            <div class="card-actions">
                <button onclick="window.open('${url}','_blank')">Open</button>
                <button class="remove" onclick="deleteBookmark('${escHtml(bm.id)}')">✕</button>
            </div>
        </div>`;
    }).join('');
}

async function deleteBookmark(id) {
    await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
    await loadAll();
}

// ── Scan page ─────────────────────────────────────────────────────────────
let scanEndPort = 1000;

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const isCustom = btn.dataset.custom === 'true';
        document.getElementById('custom-range-inputs').classList.toggle('hidden', !isCustom);
        document.getElementById('btn-scan-default').classList.toggle('hidden', isCustom);
        if (!isCustom) {
            scanEndPort = parseInt(btn.dataset.end);
            document.getElementById('btn-scan-default').textContent =
                `Scan Ports 1–${scanEndPort.toLocaleString()}`;
        }
    });
});

document.getElementById('btn-scan-custom').addEventListener('click', startScan);
document.getElementById('btn-scan-default').addEventListener('click', startScan);
document.getElementById('btn-stop-scan').addEventListener('click', () => { stopRequested = true; });

const BATCH_SIZE = 100;

async function startScan() {
    stopRequested = false;
    const isCustom = !!document.querySelector('.preset-btn.active[data-custom="true"]');
    const start = isCustom ? (parseInt(document.getElementById('scan-start').value) || 1) : 1;
    const end   = isCustom ? (parseInt(document.getElementById('scan-end').value)   || 9999) : scanEndPort;
    const total = end - start + 1;

    if (start > end) { alert('Start port must be ≤ end port.'); return; }

    document.getElementById('scan-results').innerHTML = '';
    document.getElementById('scan-progress-area').classList.remove('hidden');
    document.getElementById('btn-scan-default').classList.add('hidden');
    document.getElementById('btn-scan-custom').classList.add('hidden');
    document.getElementById('btn-stop-scan').classList.remove('hidden');
    setProgress(0, total, 0);

    let scanned = 0, found = 0;
    const container = document.getElementById('scan-results');

    for (let batchStart = start; batchStart <= end; batchStart += BATCH_SIZE) {
        if (stopRequested) break;
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, end);
        try {
            const res      = await fetch(`/api/scanner?start=${batchStart}&end=${batchEnd}`);
            const services = await res.json();
            services.forEach(s => { addScanCard(s.port, s.service, container); found++; });
        } catch (err) { console.error('Batch failed:', batchStart, err); }
        scanned += batchEnd - batchStart + 1;
        setProgress(scanned, total, found);
    }

    document.getElementById('btn-stop-scan').classList.add('hidden');
    if (isCustom) document.getElementById('btn-scan-custom').classList.remove('hidden');
    else          document.getElementById('btn-scan-default').classList.remove('hidden');
    document.getElementById('progress-text').textContent =
        (stopRequested ? 'Stopped' : 'Done') + ` · ${found} service${found !== 1 ? 's' : ''} found`;
}

function setProgress(scanned, total, found) {
    const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
    document.getElementById('progress-bar-inner').style.width = pct + '%';
    document.getElementById('progress-text').textContent = `Scanning… ${pct}%`;
    document.getElementById('progress-count').textContent =
        `${scanned.toLocaleString()} / ${total.toLocaleString()} ports · ${found} found`;
}

function addScanCard(port, service, container) {
    const card = document.createElement('div');
    card.className = 'scan-card';
    card.innerHTML = `<h3>${escHtml(service || 'Unknown')}</h3>
        <p>Port ${port}</p>
        <button class="add-btn" data-port="${port}" data-service="${escHtml(service || '')}">+ Dashboard</button>`;
    card.querySelector('.add-btn').addEventListener('click', () => openScanAddModal(port, service || ''));
    container.appendChild(card);
}

// ── Scan → Add modal ──────────────────────────────────────────────────────
function openScanAddModal(port, service) {
    document.getElementById('scan-add-port').value  = port;
    document.getElementById('scan-add-name').value  = service || `Port ${port}`;
    document.getElementById('scan-add-icon').value  = '';
    document.getElementById('scan-add-icon-search').value = '';
    populateGroupSelect('scan-add-group');
    renderIconGrid('scan-add-icon-grid', 'scan-add-icon', 'scan-add-icon-search');
    document.getElementById('scan-add-modal').classList.remove('hidden');
}

document.getElementById('btn-cancel-scan-add').addEventListener('click', () => {
    document.getElementById('scan-add-modal').classList.add('hidden');
});

document.getElementById('form-scan-add').addEventListener('submit', async e => {
    e.preventDefault();
    const port  = parseInt(document.getElementById('scan-add-port').value);
    const name  = document.getElementById('scan-add-name').value.trim();
    const icon  = document.getElementById('scan-add-icon').value || null;
    const group = document.getElementById('scan-add-group').value || null;
    await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, port, url: null, icon, group }),
    });
    document.getElementById('scan-add-modal').classList.add('hidden');
    await loadAll();
});

// ── Settings page ─────────────────────────────────────────────────────────
function renderSettingsPage() {
    renderGroupsList();
    renderBookmarksTable();
    populateGroupSelect('bm-group');
    renderIconGrid('bm-icon-grid', 'bm-icon', 'bm-icon-search');
}

// Groups list
function renderGroupsList() {
    const el = document.getElementById('groups-list');
    if (groups.length === 0) {
        el.innerHTML = '<p style="color:var(--grey);font-size:12px;">No groups yet.</p>';
        return;
    }
    el.innerHTML = groups.map(g => `
        <div class="group-row">
            <div class="group-swatch" style="background:${g.color}"></div>
            <span>${escHtml(g.name)}</span>
            <button class="del-group-btn" data-id="${escHtml(g.id)}">Delete</button>
        </div>`).join('');
    el.querySelectorAll('.del-group-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            await fetch(`/api/groups/${btn.dataset.id}`, { method: 'DELETE' });
            await loadAll();
            renderSettingsPage();
        });
    });
}

// Add group form
document.getElementById('form-add-group').addEventListener('submit', async e => {
    e.preventDefault();
    const name  = document.getElementById('group-name').value.trim();
    const color = document.getElementById('group-color').value;
    if (!name) return;
    await fetch('/api/groups', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, color }),
    });
    document.getElementById('group-name').value = '';
    await loadAll();
    renderSettingsPage();
});

// Add bookmark form
document.querySelectorAll('input[name="bm-type"]').forEach(r => {
    r.addEventListener('change', () => {
        const isUrl = r.value === 'url';
        document.getElementById('bm-url').classList.toggle('hidden', !isUrl);
        document.getElementById('bm-port').classList.toggle('hidden', isUrl);
    });
});

document.getElementById('form-add-bookmark').addEventListener('submit', async e => {
    e.preventDefault();
    const type  = document.querySelector('input[name="bm-type"]:checked').value;
    const name  = document.getElementById('bm-name').value.trim();
    const icon  = document.getElementById('bm-icon').value || null;
    const group = document.getElementById('bm-group').value || null;
    const body  = { name, icon, group, url: null, port: null };
    if (type === 'url') {
        body.url = document.getElementById('bm-url').value.trim() || null;
    } else {
        body.port = parseInt(document.getElementById('bm-port').value) || null;
    }
    await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });
    document.getElementById('form-add-bookmark').reset();
    document.getElementById('bm-url').classList.add('hidden');
    document.getElementById('bm-port').classList.remove('hidden');
    await loadAll();
    renderSettingsPage();
});

// Bookmarks table
function renderBookmarksTable() {
    const el = document.getElementById('bookmarks-table');
    if (bookmarks.length === 0) {
        el.innerHTML = '<p style="color:var(--grey);font-size:12px;">No bookmarks yet.</p>';
        return;
    }
    el.className = 'bookmarks-table';
    el.innerHTML = bookmarks.map(bm => {
        const iconHtml = bm.icon && ICONS[bm.icon]
            ? `<span class="nf bm-icon">${ICONS[bm.icon]}</span>`
            : `<span class="bm-icon">–</span>`;
        return `<div class="bookmark-row">
            ${iconHtml}
            <span class="bm-name">${escHtml(bm.name)}</span>
            <span class="bm-url">${escHtml(bookmarkUrl(bm))}</span>
            <button class="edit-btn" data-id="${escHtml(bm.id)}">Edit</button>
            <button class="del-btn"  data-id="${escHtml(bm.id)}">✕</button>
        </div>`;
    }).join('');

    el.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            await fetch(`/api/bookmarks/${btn.dataset.id}`, { method: 'DELETE' });
            await loadAll();
            renderSettingsPage();
        });
    });
    el.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
}

// ── Edit modal ────────────────────────────────────────────────────────────
function openEditModal(id) {
    const bm = bookmarks.find(b => b.id === id);
    if (!bm) return;
    document.getElementById('edit-bm-id').value   = bm.id;
    document.getElementById('edit-bm-name').value = bm.name;
    document.getElementById('edit-bm-icon').value = bm.icon || '';
    document.getElementById('edit-icon-search').value = '';
    populateGroupSelect('edit-bm-group', bm.group);

    const isUrl = !!bm.url;
    document.querySelector('input[name="edit-bm-type"][value="' + (isUrl ? 'url' : 'port') + '"]').checked = true;
    document.getElementById('edit-bm-url').classList.toggle('hidden', !isUrl);
    document.getElementById('edit-bm-port').classList.toggle('hidden', isUrl);
    if (isUrl) document.getElementById('edit-bm-url').value  = bm.url;
    else       document.getElementById('edit-bm-port').value = bm.port;

    renderIconGrid('edit-icon-grid', 'edit-bm-icon', 'edit-icon-search', bm.icon);
    document.getElementById('edit-modal').classList.remove('hidden');
}

document.querySelectorAll('input[name="edit-bm-type"]').forEach(r => {
    r.addEventListener('change', () => {
        const isUrl = r.value === 'url';
        document.getElementById('edit-bm-url').classList.toggle('hidden', !isUrl);
        document.getElementById('edit-bm-port').classList.toggle('hidden', isUrl);
    });
});

document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    document.getElementById('edit-modal').classList.add('hidden');
});

document.getElementById('form-edit-bookmark').addEventListener('submit', async e => {
    e.preventDefault();
    const id    = document.getElementById('edit-bm-id').value;
    const type  = document.querySelector('input[name="edit-bm-type"]:checked').value;
    const name  = document.getElementById('edit-bm-name').value.trim();
    const icon  = document.getElementById('edit-bm-icon').value || null;
    const group = document.getElementById('edit-bm-group').value || null;
    const body  = { name, icon, group, url: null, port: null };
    if (type === 'url') body.url  = document.getElementById('edit-bm-url').value.trim()  || null;
    else                body.port = parseInt(document.getElementById('edit-bm-port').value) || null;

    await fetch(`/api/bookmarks/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });
    document.getElementById('edit-modal').classList.add('hidden');
    await loadAll();
    renderSettingsPage();
});

// ── Icon picker ───────────────────────────────────────────────────────────
function renderIconGrid(gridId, hiddenId, searchId, selectedKey) {
    const searchEl  = document.getElementById(searchId);
    const hiddenEl  = document.getElementById(hiddenId);
    const gridEl    = document.getElementById(gridId);
    let   selected  = selectedKey || hiddenEl.value || null;

    function draw(filter) {
        const names = filter
            ? ICON_NAMES.filter(n => n.includes(filter.toLowerCase()))
            : ICON_NAMES;
        gridEl.innerHTML = names.map(name => `
            <button type="button" class="icon-btn${name === selected ? ' selected' : ''}"
                    data-name="${name}" title="${name}">
                <span class="nf">${ICONS[name]}</span>
                <span class="icon-label">${name.replace('nf-', '')}</span>
            </button>`).join('');
        gridEl.querySelectorAll('.icon-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selected = btn.dataset.name;
                hiddenEl.value = selected;
                gridEl.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    draw('');
    searchEl.addEventListener('input', () => draw(searchEl.value));
    if (selectedKey) {
        hiddenEl.value = selectedKey;
    }
}

// ── Group select helper ───────────────────────────────────────────────────
function populateGroupSelect(selectId, selectedGroupId) {
    const el = document.getElementById(selectId);
    el.innerHTML = '<option value="">No group</option>' +
        groups.map(g =>
            `<option value="${escHtml(g.id)}"${g.id === selectedGroupId ? ' selected' : ''}>${escHtml(g.name)}</option>`
        ).join('');
}

// ── Init ──────────────────────────────────────────────────────────────────
loadAll();
```

**Step 2: Verify syntax**

```bash
node --check /mnt/2tb_ssd/local_claudecode/pixel_art_launcher/static/script.js && echo "OK"
```
Expected: `OK`

**Step 3: Commit**

```bash
cd /mnt/2tb_ssd/local_claudecode && git add pixel_art_launcher/static/script.js
git commit -m "feat: full bookmarks JS — groups, icon picker, settings, scan-to-bookmark modal"
```

---

## Task 6: Rebuild Docker and smoke-test

**Step 1: Rebuild**

```bash
cd /mnt/2tb_ssd/local_claudecode/pixel_art_launcher && docker compose down && docker compose up --build -d
```
Expected: build downloads the Nerd Fonts zip, image layers complete, container starts.

**Step 2: Verify font was downloaded**

```bash
docker exec $(docker ps -q --filter name=launcher) ls -lh /app/static/fonts/
```
Expected: `SymbolsNerdFont-Regular.ttf` present, size > 200K.

**Step 3: Verify HTML loads**

```bash
curl -s http://localhost:5000/ | grep "nav-settings"
```
Expected: contains `nav-settings`

**Step 4: Verify groups API**

```bash
curl -s http://localhost:5000/api/groups
```
Expected: `[]`

**Step 5: Verify bookmarks API (migration)**

```bash
curl -s http://localhost:5000/api/bookmarks
```
Expected: JSON array (migrated existing favorites or empty)

**Step 6: Create a group and bookmark via API**

```bash
GID=$(curl -s -X POST http://localhost:5000/api/groups \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dev","color":"#27ae60"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Group ID: $GID"

curl -s -X POST http://localhost:5000/api/bookmarks \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Flask App\",\"port\":5000,\"icon\":\"flask\",\"group\":\"$GID\"}"
```
Expected: both return JSON with an `id` field.

**Step 7: Verify bookmark appears**

```bash
curl -s http://localhost:5000/api/bookmarks | python3 -c "import sys,json; bms=json.load(sys.stdin); print(bms[0]['name'] if bms else 'empty')"
```
Expected: `Flask App`

**Step 8: Final container status**

```bash
docker compose ps
```
Expected: container `Up`.
