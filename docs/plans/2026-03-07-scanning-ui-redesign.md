# Scanning & UI Redesign

**Date:** 2026-03-07
**Status:** Approved

## Goals

1. Fix port scanning — currently scans container loopback, misses all host services
2. Add real-time progress feedback during scans
3. Polish the pixel-art UI — better cards, color-coded services, progress bar

---

## Architecture

### Docker: host networking

Change `docker-compose.yml` to `network_mode: host`. Removes the `ports:` mapping (not needed). Container shares the host network stack so `127.0.0.1` resolves correctly.

### Batch scanning (frontend-driven)

The frontend drives the scan loop:
- Divides the selected range into 100-port chunks
- Calls `GET /api/scanner?start=X&end=Y` per chunk
- Appends discovered services to the results grid immediately
- Updates a progress bar after each chunk completes

The backend scans whatever range it receives and returns. No polling endpoint needed — the batch size IS the unit of work.

### Backend speed-up: ThreadPoolExecutor

Replace the serial port scan loop with `concurrent.futures.ThreadPoolExecutor(max_workers=50)`. Each batch of 100 ports scans concurrently. Per-port timeout stays at 0.1s; effective batch time drops from ~10s to ~0.2s.

### Service identification improvement

`lsof` is unavailable inside Docker. Replace with a known-ports dictionary for well-known port numbers, supplemented by `socket.getservbyport()` as fallback. No external process calls.

---

## UI Components

### Progress bar
- Pixel-art style (chunky filled blocks)
- Shows: `Scanned X / Y ports · Z found`
- Animates chunk-by-chunk as batches complete

### Service type color coding (card left border + label)
| Color  | Category       | Example ports            |
|--------|----------------|--------------------------|
| Green  | Web            | 80, 443, 3000, 8080, 8443 |
| Blue   | Database       | 3306, 5432, 6379, 27017  |
| Yellow | Dev / internal | 4200, 5173, 9000, 9200   |
| Red    | Admin / infra  | 22, 8888, 9090           |
| Grey   | Unknown        | everything else          |

### Cards
- Port number as accent-colored pill badge
- Service name bold, category label small below
- Pixel shadow on hover, staggered `fadeInUp` animation on entry

### Empty dashboard state
- Centered pixel-art placeholder message
- Prompt directing user to scan

### Scan controls
- Preset buttons centered, active state highlighted
- Progress section replaces plain "Scanning in progress…" text
- "Stop scan" button appears while scanning is active

---

## Files Changed

| File | Change |
|------|--------|
| `docker-compose.yml` | `network_mode: host`, remove `ports:` |
| `app.py` | ThreadPoolExecutor scan, replace lsof with port dict |
| `static/script.js` | Batch scan loop, progress bar updates, stop button |
| `static/style.css` | Progress bar, color-coded cards, card polish |
| `static/index.html` | Progress bar element, stop button, empty state |
