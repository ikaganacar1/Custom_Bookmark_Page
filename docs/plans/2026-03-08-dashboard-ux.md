# Dashboard UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Smaller bookmark cards, drag-and-drop reordering, and three visualization modes (grid / grouped / list) on the dashboard.

**Architecture:** Pure frontend changes for cards and view modes (CSS + JS). Drag-and-drop order persistence requires one new Flask endpoint. View mode is stored in `localStorage`. No new dependencies.

**Tech Stack:** Vanilla JS, CSS, Python/Flask. No test suite — verify manually by running `python app.py` and opening `http://localhost:5000`.

---

### Task 1: Smaller Cards

**Files:**
- Modify: `static/style.css` — `.pixel-grid`, `.pixel-card`, `.card-icon`

**Step 1: Apply size reductions**

In `static/style.css`, make these changes:

```css
/* ── Grid ─── (was minmax(180px,1fr), gap 18px) */
.pixel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
    padding: 10px 0;
}

/* ── Bookmark Cards ─── (was padding: 20px 16px 14px) */
.pixel-card {
    border: 3px solid var(--primary);
    background: var(--card-bg);
    padding: 12px 10px 8px;
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

/* ── Card Icon ─── (was font-size: 40px, margin-bottom: 10px) */
.card-icon {
    font-size: 24px;
    margin-bottom: 6px;
    line-height: 1;
}
```

**Step 2: Verify**

Run `python app.py`, open `http://localhost:5000`. Cards should be visibly smaller and fit more per row. Name, URL and Open button must still be visible.

**Step 3: Commit**

```bash
git add static/style.css
git commit -m "feat: shrink bookmark cards (130px min, 24px icon)"
```

---

### Task 2: Backend Reorder Endpoint

**Files:**
- Modify: `app.py` — add `POST /api/bookmarks/reorder`

**Step 1: Add the endpoint**

In `app.py`, add this route after the existing bookmark routes (before the static file routes):

```python
@app.route('/api/bookmarks/reorder', methods=['POST'])
def reorder_bookmarks():
    body = require_json()
    if isinstance(body, tuple):
        return body
    ids = body.get('ids', [])
    with _data_lock:
        data = load_data()
        bm_map = {b['id']: b for b in data['bookmarks']}
        ordered = [bm_map[i] for i in ids if i in bm_map]
        remaining = [b for b in data['bookmarks'] if b['id'] not in ids]
        data['bookmarks'] = ordered + remaining
        save_data(data)
    return jsonify({'ok': True})
```

**Step 2: Verify**

Restart the server. Run this in a terminal:

```bash
curl -s http://localhost:5000/api/bookmarks | python3 -c "import sys,json; ids=[b['id'] for b in json.load(sys.stdin)]; print(ids)"
# note the order of IDs

curl -s -X POST http://localhost:5000/api/bookmarks/reorder \
  -H 'Content-Type: application/json' \
  -d '{"ids": ["PASTE_LAST_ID_HERE", "PASTE_FIRST_ID_HERE"]}' | python3 -m json.tool

curl -s http://localhost:5000/api/bookmarks | python3 -c "import sys,json; print([b['id'] for b in json.load(sys.stdin)])"
# order should now be reversed
```

**Step 3: Commit**

```bash
git add app.py
git commit -m "feat: add POST /api/bookmarks/reorder endpoint"
```

---

### Task 3: View Mode Toggle (HTML + CSS + JS state)

**Files:**
- Modify: `static/index.html` — wrap group filter + add mode buttons
- Modify: `static/style.css` — toolbar layout, mode button styles, drag states
- Modify: `static/script.js` — `viewMode` state, mode button logic, load from localStorage

**Step 1: Update HTML — wrap dashboard toolbar**

In `static/index.html`, replace the `<div id="group-filter" ...>` block with:

```html
<div class="dashboard-toolbar">
    <div id="group-filter" class="group-filter"></div>
    <div class="view-mode-btns">
        <button id="mode-grid"    class="mode-btn active" title="Grid"><span class="nf">&#xF009;</span></button>
        <button id="mode-grouped" class="mode-btn"         title="Grouped"><span class="nf">&#xF0DB;</span></button>
        <button id="mode-list"    class="mode-btn"         title="List"><span class="nf">&#xF0CA;</span></button>
    </div>
</div>
```

**Step 2: Add CSS for toolbar and mode buttons**

In `static/style.css`, add after the `.group-filter` block:

```css
/* ── Dashboard Toolbar ──────────────────────────────────────────────────── */
.dashboard-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    padding: 16px 0 12px;
}

.dashboard-toolbar .group-filter {
    padding: 0;
    flex: 1;
    flex-wrap: wrap;
}

.view-mode-btns {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

.mode-btn {
    width: 34px;
    height: 34px;
    border: 3px solid var(--primary);
    background: var(--card-bg);
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 2px 2px 0 var(--primary);
    transition: transform 0.1s, box-shadow 0.1s;
    padding: 0;
}

.mode-btn:hover:not(.active) {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--primary);
}

.mode-btn.active {
    background: var(--accent);
    color: white;
}

/* ── Grouped View ───────────────────────────────────────────────────────── */
.group-section {
    margin-bottom: 20px;
}

.group-section-header {
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--primary);
    padding: 6px 10px;
    border-left: 5px solid var(--grey);
    margin-bottom: 8px;
    background: var(--card-bg);
    border-top: 2px solid var(--primary);
    border-bottom: 2px solid var(--primary);
    border-right: 2px solid var(--primary);
}

/* ── List View ──────────────────────────────────────────────────────────── */
.bm-list {
    display: flex;
    flex-direction: column;
}

.bm-list-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 2px solid var(--primary);
    border-bottom: none;
    background: var(--card-bg);
    cursor: pointer;
    transition: background 0.1s;
}

.bm-list-row:last-child {
    border-bottom: 2px solid var(--primary);
}

.bm-list-row:hover {
    background: var(--bg);
}

.bm-list-icon { font-size: 18px; flex-shrink: 0; width: 22px; text-align: center; }
.bm-list-name { font-size: 13px; font-weight: bold; flex-shrink: 0; min-width: 80px; }
.bm-list-url  { font-size: 11px; color: var(--grey); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.bm-list-row .open-btn {
    background: var(--accent);
    color: white;
    border: 2px solid var(--primary);
    padding: 4px 10px;
    font-family: inherit;
    cursor: pointer;
    font-weight: bold;
    font-size: 11px;
    flex-shrink: 0;
    transition: transform 0.1s, box-shadow 0.1s;
}

.bm-list-row .open-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 var(--primary);
}

/* ── Drag & Drop ────────────────────────────────────────────────────────── */
.pixel-card.dragging {
    opacity: 0.35;
}

.drag-placeholder {
    border: 3px dashed var(--primary);
    background: var(--bg);
    min-height: 80px;
}
```

Also remove the padding from the old `.group-filter` rule (it had `padding: 16px 0 12px`) since the toolbar wrapper now handles that:

```css
/* ── Group Filter Bar ───────────────────────────────────────────────────── */
.group-filter {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
```

**Step 3: Add viewMode state and mode button wiring in script.js**

At the top of `static/script.js`, add to the state block:

```js
let viewMode = localStorage.getItem('dashboard-view-mode') || 'grid';
```

After the `loadAll` function definition, add:

```js
// ── View mode buttons ──────────────────────────────────────────────────────────
['grid', 'grouped', 'list'].forEach(mode => {
    document.getElementById(`mode-${mode}`).addEventListener('click', () => {
        viewMode = mode;
        localStorage.setItem('dashboard-view-mode', mode);
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`mode-${mode}`).classList.add('active');
        renderBookmarks();
    });
});

function setInitialModeBtn() {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`mode-${viewMode}`).classList.add('active');
}
```

Call `setInitialModeBtn()` at the bottom of the file, just before `loadAll()`.

**Step 4: Verify**

Reload the page. Three icon buttons appear top-right of the filter bar. Clicking them highlights the active one and the mode is remembered on refresh (localStorage).

**Step 5: Commit**

```bash
git add static/index.html static/style.css static/script.js
git commit -m "feat: add view mode toggle (grid/grouped/list) to dashboard toolbar"
```

---

### Task 4: List and Grouped Render Modes

**Files:**
- Modify: `static/script.js` — update `renderBookmarks()` to dispatch by `viewMode`, add `renderListBookmarks()` and `renderGroupedBookmarks()`

**Step 1: Update renderBookmarks() to dispatch**

Replace the entire `renderBookmarks()` function in `script.js` with:

```js
function renderBookmarks() {
    if (viewMode === 'list')    { renderListBookmarks();    return; }
    if (viewMode === 'grouped') { renderGroupedBookmarks(); return; }
    renderGridBookmarks();
}
```

**Step 2: Rename and keep existing grid logic**

Rename the old `renderBookmarks()` body into a new function `renderGridBookmarks()`:

```js
function renderGridBookmarks() {
    const grid = document.getElementById('bookmarks-grid');
    grid.className = 'pixel-grid';
    const filtered = activeGroup === 'all'
        ? bookmarks
        : bookmarks.filter(b => b.group === activeGroup);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-pixel">[_]</div>
                <p>No bookmarks yet.</p>
                <p class="empty-hint">Go to Settings or Scan to add some.</p>
            </div>`;
        return;
    }

    grid.innerHTML = '';
    filtered.forEach(b => appendBookmarkCard(b, grid));
}
```

Extract the card-building logic from the old `renderBookmarks()` into a helper:

```js
function appendBookmarkCard(b, container) {
    const group = groups.find(g => g.id === b.group);
    const color = group ? group.color : 'var(--grey)';
    const url   = bookmarkUrl(b);
    const char  = iconChar(b.icon);

    const card = document.createElement('div');
    card.className = 'pixel-card';
    card.dataset.id = b.id;
    card.style.borderTopColor = color;
    card.innerHTML = `
        <div class="card-icon"><span class="nf"></span></div>
        <h3>${escHtml(b.name)}</h3>
        <p class="card-url">${escHtml(url)}</p>
        <div class="card-actions">
            <button class="open-btn">Open</button>
        </div>`;

    if (char) card.querySelector('.nf').textContent = char;
    else      card.querySelector('.card-icon').textContent = '?';

    card.querySelector('.open-btn').addEventListener('click', () => window.open(url, '_blank'));
    container.appendChild(card);
    return card;
}
```

**Step 3: Add renderListBookmarks()**

```js
function renderListBookmarks() {
    const grid = document.getElementById('bookmarks-grid');
    grid.className = '';
    const filtered = activeGroup === 'all'
        ? bookmarks
        : bookmarks.filter(b => b.group === activeGroup);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-pixel">[_]</div>
                <p>No bookmarks yet.</p>
                <p class="empty-hint">Go to Settings or Scan to add some.</p>
            </div>`;
        return;
    }

    const list = document.createElement('div');
    list.className = 'bm-list';

    filtered.forEach(b => {
        const url  = bookmarkUrl(b);
        const char = iconChar(b.icon);

        const row = document.createElement('div');
        row.className = 'bm-list-row';
        row.innerHTML = `
            <span class="bm-list-icon nf"></span>
            <span class="bm-list-name">${escHtml(b.name)}</span>
            <span class="bm-list-url">${escHtml(url)}</span>
            <button class="open-btn">Open</button>`;

        const iconEl = row.querySelector('.bm-list-icon');
        iconEl.textContent = char || '?';

        row.addEventListener('click', e => {
            if (!e.target.classList.contains('open-btn')) window.open(url, '_blank');
        });
        row.querySelector('.open-btn').addEventListener('click', e => {
            e.stopPropagation();
            window.open(url, '_blank');
        });
        list.appendChild(row);
    });

    grid.innerHTML = '';
    grid.appendChild(list);
}
```

**Step 4: Add renderGroupedBookmarks()**

```js
function renderGroupedBookmarks() {
    const grid = document.getElementById('bookmarks-grid');
    grid.className = '';

    const filtered = activeGroup === 'all'
        ? bookmarks
        : bookmarks.filter(b => b.group === activeGroup);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-pixel">[_]</div>
                <p>No bookmarks yet.</p>
                <p class="empty-hint">Go to Settings or Scan to add some.</p>
            </div>`;
        return;
    }

    grid.innerHTML = '';

    // Build sections: one per group that has bookmarks, then "Other"
    groups.forEach(g => {
        const items = filtered.filter(b => b.group === g.id);
        if (items.length === 0) return;
        appendGroupSection(g.name, g.color, items, g.id, grid);
    });

    const ungrouped = filtered.filter(b => !b.group || !groups.find(g => g.id === b.group));
    if (ungrouped.length > 0) {
        appendGroupSection('Other', 'var(--grey)', ungrouped, null, grid);
    }
}

function appendGroupSection(name, color, items, groupId, container) {
    const section = document.createElement('div');
    section.className = 'group-section';
    section.dataset.groupId = groupId || '';

    const header = document.createElement('div');
    header.className = 'group-section-header';
    header.textContent = name;
    header.style.borderLeftColor = color;
    section.appendChild(header);

    const miniGrid = document.createElement('div');
    miniGrid.className = 'pixel-grid';
    items.forEach(b => appendBookmarkCard(b, miniGrid));
    section.appendChild(miniGrid);

    container.appendChild(section);
}
```

**Step 5: Verify**

Open the app. Switch between the three mode buttons:
- Grid: compact cards in a flat grid
- Grouped: section headers with group color stripe, mini-grids below each
- List: horizontal rows with icon, name, URL, Open button — clicking the row opens the link

**Step 6: Commit**

```bash
git add static/script.js
git commit -m "feat: implement list and grouped view modes"
```

---

### Task 5: Drag & Drop Reordering

**Files:**
- Modify: `static/script.js` — drag handlers attached in `appendBookmarkCard()`, `doDragReorder()` function

**Step 1: Add drag state variables**

At the top of `script.js` with the other state vars, add:

```js
let dragSrcId   = null;
let dragSrcGroupId = null;
```

**Step 2: Add drag handlers in appendBookmarkCard()**

In the `appendBookmarkCard()` function, after setting `card.dataset.id = b.id`, add:

```js
card.setAttribute('draggable', 'true');

card.addEventListener('dragstart', e => {
    dragSrcId = b.id;
    dragSrcGroupId = b.group || null;
    setTimeout(() => card.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
});

card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    document.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
    dragSrcId = null;
    dragSrcGroupId = null;
});

card.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragSrcId || dragSrcId === b.id) return;
    const parent = card.parentElement;
    // Remove existing placeholder
    parent.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
    // Determine insert before or after based on cursor position
    const rect = card.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    if (e.clientX < midX) {
        parent.insertBefore(placeholder, card);
    } else {
        parent.insertBefore(placeholder, card.nextSibling);
    }
});

card.addEventListener('drop', async e => {
    e.preventDefault();
    if (!dragSrcId || dragSrcId === b.id) return;
    // Determine target group (for grouped mode cross-group drag)
    const targetGroupId = b.group || null;
    await doDragReorder(card, targetGroupId);
});
```

**Step 3: Add doDragReorder() function**

```js
async function doDragReorder(targetCard, targetGroupId) {
    // If cross-group drag in grouped mode, update the bookmark's group first
    if (viewMode === 'grouped' && dragSrcGroupId !== targetGroupId) {
        await fetch(`/api/bookmarks/${dragSrcId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                Object.assign({}, bookmarks.find(b => b.id === dragSrcId), { group: targetGroupId })
            ),
        });
    }

    // Build new order: all cards in the grid (or mini-grid), reading DOM order via placeholder position
    const parent = targetCard.parentElement;
    const placeholder = parent.querySelector('.drag-placeholder');
    const siblings = [...parent.children];

    // Build ordered ids from current DOM, inserting dragSrc where placeholder is
    const newOrder = [];
    siblings.forEach(el => {
        if (el.classList.contains('drag-placeholder')) {
            newOrder.push(dragSrcId);
        } else if (el.dataset.id && el.dataset.id !== dragSrcId) {
            newOrder.push(el.dataset.id);
        }
    });

    // If placeholder wasn't found (dropped at end), push src at end
    if (!newOrder.includes(dragSrcId)) newOrder.push(dragSrcId);

    // Merge with remaining bookmarks outside the drag container to form global order
    const inContainer = new Set(newOrder);
    const globalOrder = bookmarks.map(b => b.id).filter(id => !inContainer.has(id));
    // Insert the reordered block in place of where the first item of the block was
    const firstInBlock = bookmarks.findIndex(b => inContainer.has(b.id));
    globalOrder.splice(firstInBlock, 0, ...newOrder);

    await fetch('/api/bookmarks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: globalOrder }),
    });

    await loadAll();
}
```

**Step 4: Verify**

- In Grid mode: drag a card — it becomes semi-transparent, a dashed placeholder appears, drop it — cards reorder and persist on refresh.
- In Grouped mode: drag within same group — reorders within section. Drag to another group's section — card moves to that group and reorders there.
- In List mode: cards are not draggable (list rows don't have the drag handler — this is correct by design).

**Step 5: Commit**

```bash
git add static/script.js
git commit -m "feat: drag-and-drop bookmark reordering with persistent order"
```
