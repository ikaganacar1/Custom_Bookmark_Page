# Dashboard UX Improvements — Design

Date: 2026-03-08

## Summary

Three improvements to the dashboard: smaller bookmark cards, drag-and-drop reordering, and three visualization modes.

## Feature 1 — Smaller Cards

Reduce card size while keeping all content (icon, name, URL, Open button):

- Grid: `minmax(130px, 1fr)`, gap 12px (was 180px, 18px)
- Card padding: `12px 10px 8px` (was `20px 16px 14px`)
- Icon font-size: 24px (was 40px)
- Icon margin-bottom: 6px (was 10px)
- All text font sizes unchanged

## Feature 2 — Drag & Drop Reorder

HTML5 Drag API on bookmark cards. Order persists to backend.

**Backend:** New endpoint `POST /api/bookmarks/reorder` accepts `{ ids: ["id1", "id2", ...] }` and rewrites the bookmarks array in `favorites.json` in that order.

**Frontend:**
- Cards get `draggable="true"` attribute
- `dragstart`: mark the dragged bookmark ID
- `dragover`: show visual gap at drop target (shift cards with CSS transform or placeholder element)
- `drop`: compute new order, call reorder endpoint, call `loadAll()`
- Dragged card: `opacity: 0.4` while dragging
- Drop target: highlighted placeholder div inserted into grid

**Grouped mode drag:** Dropping a card into a different group's section updates that bookmark's `group` field via `PUT /api/bookmarks/:id` before reordering.

**List mode:** No drag and drop (rows don't support positional reorder well).

## Feature 3 — Visualization Modes

Three modes: `grid`, `grouped`, `list`. Selected mode stored in `localStorage` key `dashboard-view-mode`.

### Toolbar layout

Mode toggle buttons sit right-aligned in the group filter bar row:

```
[All] [Group A] [Group B]        [⊞] [≡] [☰]
```

Three small square buttons with Nerd Font icons, pixel-styled, matching group pill height.

### Grid mode (default)
Current flat grid, all filtered bookmarks in one `minmax(130px)` grid.

### Grouped mode
- One section per group that has visible bookmarks
- Section header: group name in bold, group color as left border accent
- Bookmarks under each header in a mini-grid (same column sizing)
- Ungrouped bookmarks collected under an "Other" section at the bottom (only shown if any exist)

### List mode
- Single column of horizontal rows
- Row layout: `[24px icon] [name bold] [url grey, flex] [Open button]`
- Full row is clickable (opens link), Open button also works
- 1px border between rows, no box-shadow cards
- No drag and drop in this mode
