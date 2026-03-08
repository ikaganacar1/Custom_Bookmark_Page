# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

**Docker (primary deployment method):**
```bash
docker-compose up --build
# Access at http://localhost:5000
```

**Local development (no Docker):**
```bash
pip install flask
python app.py
# Runs at http://0.0.0.0:5000 with debug=True
```

There is no test suite — validation is manual via the web interface.

## Architecture

Single-page web app: Python Flask backend + vanilla HTML/CSS/JS frontend, deployed via Docker.

**Backend (`app.py`):**
- Serves static files and a REST API
- Data stored in `data/favorites.json` (mounted volume in Docker)
- Atomic writes via temp file + `os.replace()` to prevent corruption
- Thread-safe operations with `threading.Lock`
- Port scanning uses raw sockets with `ThreadPoolExecutor` (50 workers, max 500 ports per request), localhost only

**Data models in `favorites.json`:**
- `bookmarks`: `{id, name, url, port, icon, group}` — either a URL or local port
- `groups`: `{id, name, color}` — categories for organizing bookmarks
- Auto-migrates old flat list format on startup

**API endpoints:**
- `GET/POST /api/groups`, `PUT/DELETE /api/groups/<gid>`
- `GET/POST /api/bookmarks`, `PUT/DELETE /api/bookmarks/<bid>`
- `GET /api/scanner?start=<n>&end=<n>` — port scan

**Frontend (`static/`):**
- Single HTML file with three views: Dashboard, Scan, Settings (no framework)
- Global state: `bookmarks[]`, `groups[]`, `activeGroup`, `stopRequested`
- All user actions call the API then invoke `loadAll()` to refresh all views
- Icons are Nerd Fonts Symbols Only (downloaded at Docker build time into `static/fonts/`)
- `escHtml()` used throughout for XSS prevention

**Nerd Font icons** are referenced by Unicode codepoints in a 147-entry `ICONS` object in `script.js`. The `.nf` CSS class applies the font.
