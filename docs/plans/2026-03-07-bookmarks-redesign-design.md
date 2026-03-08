# Bookmarks Redesign Design

**Date:** 2026-03-07
**Status:** Approved

## Goals

1. Turn the app into a proper browser landing page — bookmarks with icons, groups, and manual entry
2. Support both local port-based bookmarks and full arbitrary URLs
3. Add Nerd Font icons served locally (no CDN dependency)
4. Group bookmarks with color-coded filter tabs on the dashboard
5. Add a Settings tab for manual bookmark and group management

---

## Data Model

`data/favorites.json` becomes a structured object:

```json
{
  "groups": [
    { "id": "abc1", "name": "Dev", "color": "#27ae60" }
  ],
  "bookmarks": [
    {
      "id": "xyz2",
      "name": "Jellyfin",
      "url": "http://192.168.1.10:8096",
      "port": null,
      "icon": "nf-mdi-television",
      "group": "abc1"
    }
  ]
}
```

Rules:
- A bookmark has either `port` (integer, generates `http://localhost:{port}`) OR `url` (full string) — never both
- `group` is nullable — ungrouped bookmarks appear under "All"
- `id` is a short random hex string (8 chars), generated server-side on creation
- Groups own: `id` (8-char hex), `name` (string), `color` (hex color string)

---

## API

### Groups
- `GET /api/groups` — list all groups
- `POST /api/groups` — create group (`{name, color}`)
- `PUT /api/groups/<id>` — update group (`{name?, color?}`)
- `DELETE /api/groups/<id>` — delete group (bookmarks in group become ungrouped)

### Bookmarks (replaces /api/favorites)
- `GET /api/bookmarks` — list all bookmarks
- `POST /api/bookmarks` — create bookmark (`{name, url?, port?, icon?, group?}`)
- `PUT /api/bookmarks/<id>` — update bookmark
- `DELETE /api/bookmarks/<id>` — delete bookmark

The old `/api/favorites` endpoints are removed. Migration: on first load, if `favorites.json` contains an array (old format), auto-migrate to new format.

---

## Navigation

Three tabs: **Dashboard · Scan · Settings**

---

## Dashboard

**Group filter bar** sits between the nav and the grid:
- Pill buttons: `All` + one per group, colored with the group's color when active
- Clicking a pill filters the grid
- Default: `All` selected

**Bookmark cards:**
- Large Nerd Font icon centered at top (48px)
- Group color as a 4px top border stripe
- Name bold, URL/port smaller below
- "Open" button opens the URL in a new tab
- Hover → pixel-art lift effect

**Empty state:** Prompt to go to Settings or Scan to add bookmarks.

---

## Scan Page

Unchanged scan flow. "Add to Dashboard" now opens an inline mini-form per card:
- Name (pre-filled with detected service name)
- Icon (searchable icon picker, pre-selected based on service type)
- Group (dropdown of existing groups + "none")
- Confirm button saves to `/api/bookmarks`

---

## Settings Page

### Section 1: Manage Groups
- Table: group color swatch · name · edit button · delete button
- "New Group" form: name input + color picker (HTML `<input type="color">`) + Add button
- Inline edit on existing groups (click edit → row becomes editable)

### Section 2: Add Bookmark Manually
- Name input
- Type toggle: **Port** (number input → `http://localhost:{port}`) or **URL** (text input)
- Icon picker: searchable grid of ~150 curated Nerd Font icons
- Group dropdown (nullable)
- Submit button

### Section 3: Manage Bookmarks
- Table of all bookmarks: icon · name · URL/port · group · edit · delete
- Edit opens the same form inline

---

## Nerd Fonts

- Font file: `NerdFontsSymbolsOnly-Regular.ttf` / `.woff2` (~300KB) downloaded at Docker build time via `curl` from the GitHub releases
- Served as static file from Flask at `/static/fonts/`
- CSS `@font-face` declaration in `style.css`
- Icon lookup: a JS object `ICONS` mapping class names (e.g. `"nf-mdi-television"`) to Unicode codepoints (e.g. `"\uF489"`)
- Curated list of ~150 icons relevant to home lab / browser use (media, dev, database, network, etc.)
- Icon picker: text search filters by icon name, results show as a grid of icon + label, clicking selects it
- Rendering: `<span class="nf" data-icon="nf-mdi-television"></span>` → JS sets `textContent` to the codepoint, CSS applies the font

---

## Migration

On app startup, `load_data()` checks if `favorites.json` is an array (old format):
- If array: converts each `{port, service}` entry to a bookmark `{id, name: service, port, url: null, icon: null, group: null}`
- Writes new format back to disk
- Old `/api/favorites` endpoints removed; frontend updated to use `/api/bookmarks`

---

## Files Changed

| File | Change |
|------|--------|
| `app.py` | New data model, CRUD endpoints for bookmarks + groups, migration logic |
| `data/favorites.json` | Migrated to new format on first run |
| `static/index.html` | Three tabs, group filter bar, settings page structure |
| `static/script.js` | Full rewrite — bookmarks, groups, icon picker, settings, scan integration |
| `static/style.css` | Group filter pills, card top stripe, icon styles, settings table, icon picker |
| `static/fonts/` | NerdFontsSymbolsOnly woff2 + ttf |
| `Dockerfile` | Download Nerd Fonts during build |
