# Scanning & UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix port scanning to work against the host machine, add real-time batch progress, and polish the pixel-art UI with color-coded service cards and a progress bar.

**Architecture:** Docker switches to `network_mode: host` so `127.0.0.1` hits the real host. Backend uses `ThreadPoolExecutor` to scan ports concurrently per batch. Frontend drives a loop of 100-port API calls, updating a progress bar and appending cards after each batch.

**Tech Stack:** Python Flask, `concurrent.futures.ThreadPoolExecutor`, Vanilla JS (async/await), CSS custom properties

---

## Task 1: Switch Docker to host networking

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Replace port mapping with host network mode**

Change `docker-compose.yml` to:

```yaml
services:
  launcher:
    build: .
    network_mode: host
    volumes:
      - ./data:/app/data
    restart: always
```

`network_mode: host` makes the container share the host's network stack. The `ports:` mapping is incompatible with host networking and must be removed — the app still binds to port 5000 on the host directly.

**Step 2: Verify**

```bash
docker compose down && docker compose up --build -d
curl -s http://localhost:5000/api/favorites
```
Expected: JSON array response (proves the app is reachable)

**Step 3: Commit**

```bash
git add pixel_art_launcher/docker-compose.yml
git commit -m "fix: switch to host network mode so scanner sees host ports"
```

---

## Task 2: Replace backend scanner with concurrent port scanning

**Files:**
- Modify: `app.py`

**Step 1: Replace the scanner logic**

Replace the entire contents of `app.py` with:

```python
from flask import Flask, jsonify, send_from_directory, request
import json
import os
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__, static_folder='static')

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'favorites.json')

# Well-known port → service name mapping
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

def load_favorites():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return []

def save_favorites(favorites):
    with open(DATA_FILE, 'w') as f:
        json.dump(favorites, f, indent=2)

def scan_port(port, timeout=0.1):
    """Check if a specific port is open."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result == 0
    except Exception:
        return False

def identify_service(port):
    """Identify the service running on a port."""
    if port in KNOWN_PORTS:
        return KNOWN_PORTS[port]
    try:
        return socket.getservbyport(port)
    except Exception:
        return 'Unknown'

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/style.css')
def serve_css():
    return send_from_directory('static', 'style.css')

@app.route('/script.js')
def serve_js():
    return send_from_directory('static', 'script.js')

@app.route('/api/scanner', methods=['GET'])
def scan_ports():
    """Scan port range concurrently and return active services."""
    start_port = request.args.get('start', 1, type=int)
    end_port = request.args.get('end', 100, type=int)

    # Clamp to reasonable batch size to avoid runaway requests
    end_port = min(end_port, start_port + 499)

    active_services = []

    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {executor.submit(scan_port, port): port for port in range(start_port, end_port + 1)}
        for future in as_completed(futures):
            port = futures[future]
            if future.result():
                active_services.append({
                    'port': port,
                    'service': identify_service(port)
                })

    active_services.sort(key=lambda x: x['port'])
    return jsonify(active_services)

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    return jsonify(load_favorites())

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    data = request.json
    favorites = load_favorites()
    if data['port'] not in [f['port'] for f in favorites]:
        favorites.append(data)
        save_favorites(favorites)
    return jsonify(favorites)

@app.route('/api/favorites/<int:port>', methods=['DELETE'])
def remove_favorite(port):
    favorites = load_favorites()
    favorites = [f for f in favorites if f['port'] != port]
    save_favorites(favorites)
    return jsonify(favorites)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

**Step 2: Verify syntax**

```bash
cd pixel_art_launcher && python -c "import ast; ast.parse(open('app.py').read()); print('OK')"
```
Expected: `OK`

**Step 3: Test scanner endpoint manually**

```bash
docker compose down && docker compose up --build -d
sleep 2
curl -s "http://localhost:5000/api/scanner?start=5000&end=5000"
```
Expected: `[{"port": 5000, "service": "Flask"}]` (the app itself is on 5000)

**Step 4: Commit**

```bash
git add pixel_art_launcher/app.py
git commit -m "fix: concurrent port scanning with known-ports dict, remove lsof dependency"
```

---

## Task 3: Update HTML with progress bar, stop button, and empty state

**Files:**
- Modify: `static/index.html`

**Step 1: Replace index.html**

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
            <button id="nav-scan">Scan & Settings</button>
        </nav>

        <!-- Dashboard View -->
        <div id="view-dashboard" class="view active">
            <h1>Your Apps</h1>
            <div id="favorites-grid" class="pixel-grid">
                <div class="empty-state">
                    <div class="empty-pixel">[_]</div>
                    <p>No apps yet.</p>
                    <p class="empty-hint">Go to Scan &amp; Settings to find services.</p>
                </div>
            </div>
        </div>

        <!-- Scan View -->
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

            <!-- Progress -->
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
    </div>
    <script src="script.js"></script>
</body>
</html>
```

**Step 2: Verify it loads**

```bash
curl -s http://localhost:5000/ | grep "progress-bar"
```
Expected: line containing `progress-bar-outer`

**Step 3: Commit**

```bash
git add pixel_art_launcher/static/index.html
git commit -m "html: add progress bar, stop button, empty state"
```

---

## Task 4: Rewrite CSS with polished pixel-art styles

**Files:**
- Modify: `static/style.css`

**Step 1: Replace style.css entirely**

```css
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

/* ── Navigation ── */
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

/* ── Views ── */
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

/* ── Scan Controls ── */
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

/* ── Progress Bar ── */
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
        var(--accent) 0px,
        var(--accent) 14px,
        #c0392b 14px,
        #c0392b 16px
    );
    transition: width 0.3s ease;
}

/* ── Grid ── */
.pixel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 18px;
    padding: 10px 0;
}

/* ── Cards ── */
.pixel-card {
    border: 3px solid var(--primary);
    background: var(--card-bg);
    padding: 18px 18px 14px;
    text-align: center;
    box-shadow: 4px 4px 0 var(--primary);
    transition: transform 0.1s, box-shadow 0.1s;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    animation: fadeInUp 0.25s ease-out;
    border-left: 6px solid var(--grey);
}

.pixel-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--primary);
}

/* Service type color coding — applied via JS */
.pixel-card.type-web   { border-left-color: var(--green); }
.pixel-card.type-db    { border-left-color: var(--blue); }
.pixel-card.type-dev   { border-left-color: var(--yellow); }
.pixel-card.type-admin { border-left-color: var(--red); }

.port-badge {
    display: inline-block;
    background: var(--accent);
    color: white;
    font-size: 11px;
    font-weight: bold;
    padding: 3px 8px;
    border: 2px solid var(--primary);
    margin-bottom: 10px;
}

.pixel-card h3 {
    margin: 0 0 4px;
    color: var(--primary);
    font-size: 14px;
}

.pixel-card .service-category {
    font-size: 11px;
    color: var(--grey);
    margin: 0 0 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.pixel-card p {
    margin: 0 0 14px;
    color: #7f8c8d;
    font-size: 12px;
}

.pixel-card .card-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
}

.pixel-card button {
    background: var(--accent);
    color: white;
    border: 2px solid var(--primary);
    padding: 7px 12px;
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

/* ── Empty State ── */
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

.empty-state p {
    margin: 4px 0;
    font-size: 14px;
    font-weight: bold;
}

.empty-hint {
    font-size: 12px !important;
    font-weight: normal !important;
    margin-top: 8px !important;
}

/* ── Animations ── */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 1024px) and (min-width: 769px) {
    #app { max-width: 90%; }
    .pixel-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    .pixel-nav { flex-direction: column; gap: 4px; }
    .pixel-nav button { width: 100%; }
    #app { padding: 12px; }
    .pixel-grid { grid-template-columns: 1fr; }
    .pixel-card { padding: 14px; }
}
```

**Step 2: Commit**

```bash
git add pixel_art_launcher/static/style.css
git commit -m "style: full pixel-art polish — progress bar, color-coded cards, empty state"
```

---

## Task 5: Rewrite JavaScript with batch scanning and progress

**Files:**
- Modify: `static/script.js`

**Step 1: Replace script.js entirely**

```javascript
// ── Service type classification ──────────────────────────────────────────────
const SERVICE_TYPES = {
    web:   [80, 443, 3000, 4200, 5000, 5173, 8000, 8080, 8081, 8443, 9000],
    db:    [1433, 1521, 3306, 5432, 6379, 7474, 9200, 11211, 27017],
    dev:   [4000, 4567, 5001, 5555, 8888, 9090, 15672, 50000],
    admin: [22, 23, 2375, 2376, 6443],
};

function getServiceType(port) {
    for (const [type, ports] of Object.entries(SERVICE_TYPES)) {
        if (ports.includes(port)) return type;
    }
    return 'unknown';
}

// ── State ────────────────────────────────────────────────────────────────────
let favorites = [];
let stopRequested = false;

// ── Navigation ───────────────────────────────────────────────────────────────
document.getElementById('nav-dashboard').addEventListener('click', () => switchView('dashboard'));
document.getElementById('nav-scan').addEventListener('click', () => switchView('scan'));

function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.pixel-nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(`view-${name}`).classList.add('active');
    document.getElementById(`nav-${name}`).classList.add('active');
}

// ── Favorites ────────────────────────────────────────────────────────────────
async function loadFavorites() {
    try {
        const res = await fetch('/api/favorites');
        favorites = await res.json();
    } catch {
        favorites = [];
    }
    renderFavorites();
}

function renderFavorites() {
    const grid = document.getElementById('favorites-grid');
    if (favorites.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-pixel">[_]</div>
                <p>No apps yet.</p>
                <p class="empty-hint">Go to Scan &amp; Settings to find services.</p>
            </div>`;
        return;
    }
    grid.innerHTML = favorites.map(f => {
        const type = getServiceType(f.port);
        return `
        <div class="pixel-card type-${type}">
            <div>
                <span class="port-badge">:${f.port}</span>
                <h3>${f.service || 'App'}</h3>
                <p class="service-category">${type}</p>
            </div>
            <div class="card-actions">
                <button onclick="window.open('http://localhost:${f.port}', '_blank')">Open</button>
                <button class="remove" onclick="removeFavorite(${f.port})">Remove</button>
            </div>
        </div>`;
    }).join('');
}

async function addFavorite(port, service) {
    await fetch('/api/favorites', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({port, service})
    });
    loadFavorites();
}

async function removeFavorite(port) {
    await fetch(`/api/favorites/${port}`, {method: 'DELETE'});
    loadFavorites();
}

// ── Scan preset buttons ───────────────────────────────────────────────────────
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

// ── Batch scan ────────────────────────────────────────────────────────────────
const BATCH_SIZE = 100;

async function startScan() {
    stopRequested = false;

    const isCustom = !!document.querySelector('.preset-btn.active[data-custom]');
    const start = isCustom ? (parseInt(document.getElementById('scan-start').value) || 1) : 1;
    const end   = isCustom ? (parseInt(document.getElementById('scan-end').value)   || 9999) : scanEndPort;
    const total = end - start + 1;

    // UI: show progress, hide scan button, show stop button
    document.getElementById('scan-results').innerHTML = '';
    document.getElementById('scan-progress-area').classList.remove('hidden');
    document.getElementById('btn-scan-default').classList.add('hidden');
    document.getElementById('btn-scan-custom').classList.add('hidden');
    document.getElementById('btn-stop-scan').classList.remove('hidden');
    setProgress(0, total, 0);

    let scanned = 0;
    let found = 0;
    const resultsContainer = document.getElementById('scan-results');

    for (let batchStart = start; batchStart <= end; batchStart += BATCH_SIZE) {
        if (stopRequested) break;

        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, end);
        try {
            const res = await fetch(`/api/scanner?start=${batchStart}&end=${batchEnd}`);
            const services = await res.json();
            services.forEach(s => {
                addScanCard(s.port, s.service, resultsContainer);
                found++;
            });
        } catch (err) {
            console.error('Batch failed:', batchStart, err);
        }

        scanned += batchEnd - batchStart + 1;
        setProgress(scanned, total, found);
    }

    // UI: restore buttons, update label
    document.getElementById('btn-stop-scan').classList.add('hidden');
    const wasCustom = !!document.querySelector('.preset-btn.active[data-custom]');
    if (wasCustom) {
        document.getElementById('btn-scan-custom').classList.remove('hidden');
    } else {
        document.getElementById('btn-scan-default').classList.remove('hidden');
    }

    const progressText = document.getElementById('progress-text');
    progressText.textContent = stopRequested
        ? `Stopped · ${found} service${found !== 1 ? 's' : ''} found`
        : `Done · ${found} service${found !== 1 ? 's' : ''} found`;
}

function setProgress(scanned, total, found) {
    const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
    document.getElementById('progress-bar-inner').style.width = pct + '%';
    document.getElementById('progress-text').textContent = `Scanning… ${pct}%`;
    document.getElementById('progress-count').textContent =
        `${scanned.toLocaleString()} / ${total.toLocaleString()} ports · ${found} found`;
}

function addScanCard(port, service, container) {
    const type = getServiceType(port);
    const card = document.createElement('div');
    card.className = `pixel-card type-${type}`;
    card.innerHTML = `
        <div>
            <span class="port-badge">:${port}</span>
            <h3>${service || 'Unknown'}</h3>
            <p class="service-category">${type}</p>
        </div>
        <div class="card-actions">
            <button onclick="addFavorite(${port}, '${(service || '').replace(/'/g, "\\'")}')">+ Dashboard</button>
        </div>`;
    container.appendChild(card);
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadFavorites();
```

**Step 2: Verify syntax**

```bash
node --check pixel_art_launcher/static/script.js && echo "OK"
```
Expected: `OK`

**Step 3: Commit**

```bash
git add pixel_art_launcher/static/script.js
git commit -m "feat: batch scan loop, progress bar, stop button, service color coding"
```

---

## Task 6: Rebuild Docker and smoke-test

**Step 1: Rebuild and restart**

```bash
cd pixel_art_launcher
docker compose down && docker compose up --build -d
sleep 3
```

**Step 2: Verify app loads**

```bash
curl -s http://localhost:5000/ | grep "progress-bar-outer"
```
Expected: output contains `progress-bar-outer`

**Step 3: Verify scanner finds the launcher itself**

```bash
curl -s "http://localhost:5000/api/scanner?start=4999&end=5001"
```
Expected: `[{"port": 5000, "service": "Flask"}]`

**Step 4: Commit remaining file changes (docker-compose already committed)**

```bash
git add pixel_art_launcher/CLAUDE.md   # if changed
git status
```
No additional files should be untracked. All changes committed in prior tasks.

**Step 5: Final status**

```bash
docker compose ps
```
Expected: container status `Up`, port 5000 accessible.
