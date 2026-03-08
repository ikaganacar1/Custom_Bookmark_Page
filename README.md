# Pixel Art Launcher

A self-hosted bookmark dashboard with a pixel-art aesthetic. Organise your local services and favourite URLs into groups, discover running services by scanning localhost ports, and launch everything from one place.

![Dashboard — Grid View](Dashboard_screenshot_1.png)

---

## Features

- **Three dashboard views** — Grid, Grouped (bookmarks under section headers), and List — switchable with one click and remembered across sessions
- **Drag-and-drop reordering** — rearrange bookmarks in grid and grouped views; order persists to disk
- **Groups** — colour-coded categories with filter pills on the dashboard
- **Port scanner** — scans localhost port ranges in parallel and lets you add discovered services directly to the dashboard
- **Nerd Font icons** — 147 icons searchable by name, rendered via Nerd Fonts Symbols
- **Persistent storage** — everything saved to a local JSON file; no database required
- **Docker-first** — single `docker-compose up --build` to run

---

## Screenshots

### Dashboard — Grouped View
![Dashboard — Grouped View](Dashboard_screenshot_2.png)

### Dashboard — List View
![Dashboard — List View](Dashboard_screenshot_3.png)

### Port Scanner
![Port Scanner](Scan_screenshot_1.png)

### Settings
![Settings](Settings_screenshot_1.png)

---

## Quick Start

**With Docker (recommended):**

```bash
git clone https://github.com/ikaganacar1/Custom_Bookmark_Page.git
cd Custom_Bookmark_Page
docker-compose up --build
```

Open [http://localhost:5000](http://localhost:5000).

Bookmark data is stored in `./data/favorites.json` and mounted into the container, so it survives rebuilds.

**Without Docker:**

```bash
pip install flask
python app.py
```

---

## Usage

| Tab | What it does |
|---|---|
| **Dashboard** | Launch bookmarks. Filter by group, switch view mode, drag to reorder. |
| **Scan** | Scan a port range on localhost. Click `+ Dashboard` to save a discovered service. |
| **Settings** | Create/edit groups and bookmarks. Choose a port number or a full URL, pick an icon. |

---

## Tech Stack

- **Backend** — Python 3.11 + Flask
- **Frontend** — Vanilla HTML / CSS / JavaScript (no frameworks)
- **Storage** — `data/favorites.json`
- **Icons** — [Nerd Fonts Symbols Only](https://github.com/ryanoasis/nerd-fonts)
- **Deployment** — Docker + Docker Compose (`network_mode: host` for localhost access)
