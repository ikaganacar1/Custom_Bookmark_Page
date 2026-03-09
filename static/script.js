// ── Icons ──────────────────────────────────────────────────────────────────────
const ICONS = {
    // Streaming & Entertainment
    'nf-fa-youtube':         '\uF167',
    'nf-fa-youtube_play':    '\uF16A',
    'nf-fa-spotify':         '\uF1BC',
    'nf-fa-twitch':          '\uF1E8',
    'nf-fa-vimeo':           '\uF27D',
    'nf-fa-film':            '\uF008',
    'nf-fa-television':      '\uF26C',
    'nf-fa-music':           '\uF001',
    'nf-fa-headphones':      '\uF025',
    'nf-fa-podcast':         '\uF2CE',
    'nf-fa-microphone':      '\uF130',
    'nf-fa-camera':          '\uF030',
    'nf-fa-video_camera':    '\uF03D',
    'nf-fa-photo':           '\uF03E',
    // Social Media
    'nf-fa-twitter':         '\uF099',
    'nf-fa-instagram':       '\uF16D',
    'nf-fa-facebook':        '\uF09A',
    'nf-fa-reddit':          '\uF1A1',
    'nf-fa-linkedin':        '\uF0E1',
    'nf-fa-pinterest':       '\uF0D2',
    'nf-fa-whatsapp':        '\uF232',
    'nf-fa-telegram':        '\uF2C6',
    'nf-fa-slack':           '\uF198',
    'nf-fa-skype':           '\uF17E',
    'nf-fa-github':          '\uF09B',
    'nf-fa-gitlab':          '\uF296',
    'nf-fa-stack_overflow':  '\uF16C',
    // AI & Machine Learning
    'nf-cod-circuit_board':  '\uEABE',
    'nf-fa-brain':           '\uEE9C',
    'nf-fa-magic':           '\uF0D0',
    'nf-fa-atom':            '\uEE99',
    'nf-fa-microchip':       '\uF2DB',
    'nf-fa-flask':           '\uF0C3',
    'nf-fa-lightbulb':       '\uF0EB',
    // Browsers
    'nf-fa-chrome':          '\uF268',
    'nf-fa-firefox':         '\uF269',
    'nf-fa-opera':           '\uF26A',
    'nf-fa-edge':            '\uF26B',
    // Cloud & Services
    'nf-fa-amazon':          '\uF19B',
    'nf-fa-google':          '\uF1A0',
    'nf-fa-dropbox':         '\uF16B',
    'nf-fa-trello':          '\uF181',
    'nf-fa-cloud':           '\uF0C2',
    'nf-fa-cloud_upload':    '\uF0EE',
    'nf-fa-cloud_download':  '\uF0ED',
    // Dev
    'nf-fa-code':            '\uF121',
    'nf-fa-terminal':        '\uF120',
    'nf-fa-git':             '\uF1D3',
    'nf-fa-bug':             '\uF188',
    'nf-fa-puzzle_piece':    '\uF12E',
    'nf-fa-code_fork':       '\uF126',
    'nf-dev-docker':         '\uE711',
    'nf-dev-python':         '\uE7A8',
    'nf-dev-nodejs':         '\uE606',
    'nf-dev-ruby':           '\uE61E',
    'nf-dev-react':          '\uE7BA',
    'nf-dev-angular':        '\uE753',
    'nf-dev-sass':           '\uE609',
    // Database
    'nf-fa-database':        '\uF1C0',
    'nf-fa-table':           '\uF0CE',
    'nf-fa-hdd':             '\uF0A0',
    'nf-dev-redis':          '\uE776',
    'nf-dev-mysql':          '\uE704',
    'nf-dev-mongodb':        '\uE7A3',
    'nf-dev-postgresql':     '\uE794',
    // Network / Server
    'nf-fa-server':          '\uF233',
    'nf-fa-globe':           '\uF0AC',
    'nf-fa-wifi':            '\uF1EB',
    'nf-fa-lock':            '\uF023',
    'nf-fa-unlock':          '\uF09C',
    'nf-fa-key':             '\uF084',
    'nf-fa-shield':          '\uF132',
    'nf-fa-exchange':        '\uF0EC',
    'nf-fa-random':          '\uF074',
    'nf-fa-sitemap':         '\uF0E8',
    'nf-fa-usb':             '\uF287',
    // Storage
    'nf-fa-folder':          '\uF07B',
    'nf-fa-file':            '\uF15B',
    'nf-fa-file_text':       '\uF15C',
    'nf-fa-download':        '\uF019',
    'nf-fa-upload':          '\uF093',
    'nf-fa-floppy_disk':     '\uF0C7',
    'nf-fa-inbox':           '\uF01C',
    // Monitoring / Admin
    'nf-fa-cog':             '\uF013',
    'nf-fa-cogs':            '\uF085',
    'nf-fa-wrench':          '\uF0AD',
    'nf-fa-chart_bar':       '\uF080',
    'nf-fa-chart_line':      '\uF201',
    'nf-fa-pie_chart':       '\uF200',
    'nf-fa-tachometer':      '\uF0E4',
    'nf-fa-tasks':           '\uF0AE',
    'nf-fa-bell':            '\uF0F3',
    'nf-fa-rss':             '\uF09E',
    'nf-fa-stethoscope':     '\uF0F0',
    // Home / User
    'nf-fa-home':            '\uF015',
    'nf-fa-star':            '\uF005',
    'nf-fa-heart':           '\uF004',
    'nf-fa-bookmark':        '\uF02E',
    'nf-fa-user':            '\uF007',
    'nf-fa-users':           '\uF0C0',
    'nf-fa-sign_in':         '\uF090',
    // Communication
    'nf-fa-envelope':        '\uF0E0',
    'nf-fa-comments':        '\uF086',
    // Calendar / Time
    'nf-fa-calendar':        '\uF073',
    'nf-fa-clock':           '\uF017',
    'nf-fa-refresh':         '\uF021',
    // OS / Platform
    'nf-fa-linux':           '\uF17C',
    'nf-fa-windows':         '\uF17A',
    'nf-fa-apple':           '\uF179',
    'nf-fa-android':         '\uF17B',
    // Misc
    'nf-fa-book':            '\uF02D',
    'nf-fa-cube':            '\uF1B2',
    'nf-fa-cubes':           '\uF1B3',
    'nf-fa-fire':            '\uF06D',
    'nf-fa-bolt':            '\uF0E7',
    'nf-fa-coffee':          '\uF0F4',
    'nf-fa-gamepad':         '\uF11B',
    'nf-fa-power_off':       '\uF011',
    'nf-fa-recycle':         '\uF1B8',
    'nf-fa-map':             '\uF279',
    'nf-fa-flag':            '\uF024',
    'nf-fa-print':           '\uF02F',
    'nf-fa-search':          '\uF002',
    'nf-fa-tag':             '\uF02B',
    'nf-fa-tags':            '\uF02C',
    'nf-fa-trash':           '\uF1F8',
    'nf-fa-columns':         '\uF0DB',
    'nf-fa-list':            '\uF0CA',
    'nf-fa-th_large':        '\uF009',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function bookmarkUrl(b) {
    return b.port ? `http://localhost:${b.port}` : (b.url || '#');
}

function iconChar(name) {
    return ICONS[name] || '';
}

// ── State ──────────────────────────────────────────────────────────────────────
let bookmarks = [];
let groups    = [];
let activeGroup = 'all';
let stopRequested = false;
let dragSrcId      = null;
let dragSrcGroupId = null;
const VALID_MODES = ['grid', 'grouped', 'list'];
let viewMode = VALID_MODES.includes(localStorage.getItem('dashboard-view-mode'))
    ? localStorage.getItem('dashboard-view-mode')
    : 'grid';

// ── Navigation ─────────────────────────────────────────────────────────────────
document.getElementById('nav-dashboard').addEventListener('click', () => switchView('dashboard'));
document.getElementById('nav-scan').addEventListener('click',      () => switchView('scan'));
document.getElementById('nav-settings').addEventListener('click',  () => switchView('settings'));

function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.pixel-nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(`view-${name}`).classList.add('active');
    document.getElementById(`nav-${name}`).classList.add('active');
}

// ── Data loading ───────────────────────────────────────────────────────────────
async function loadAll() {
    const [gRes, bRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/bookmarks'),
    ]);
    groups    = await gRes.json();
    bookmarks = await bRes.json();
    renderGroupPills();
    renderBookmarks();
    renderGroupsList();
    renderBookmarksTable();
    populateGroupDropdowns();
}

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

// ── Dashboard: group filter pills ─────────────────────────────────────────────
function renderGroupPills() {
    const bar = document.getElementById('group-filter');
    bar.innerHTML = '';

    const allPill = document.createElement('button');
    allPill.className = 'group-pill' + (activeGroup === 'all' ? ' active' : '');
    allPill.textContent = 'All';
    allPill.dataset.group = 'all';
    if (activeGroup === 'all') allPill.style.background = 'var(--primary)';
    allPill.addEventListener('click', () => { activeGroup = 'all'; renderGroupPills(); renderBookmarks(); });
    bar.appendChild(allPill);

    groups.forEach(g => {
        const pill = document.createElement('button');
        pill.className = 'group-pill' + (activeGroup === g.id ? ' active' : '');
        pill.textContent = g.name;
        pill.dataset.group = g.id;
        if (activeGroup === g.id) {
            pill.style.background = g.color;
            pill.style.borderColor = g.color;
        }
        pill.addEventListener('click', () => { activeGroup = g.id; renderGroupPills(); renderBookmarks(); });
        bar.appendChild(pill);
    });
}

// ── Dashboard: bookmark cards ──────────────────────────────────────────────────
function renderBookmarks() {
    if (viewMode === 'list')    { renderListBookmarks();    return; }
    if (viewMode === 'grouped') { renderGroupedBookmarks(); return; }
    renderGridBookmarks();
}

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

function appendBookmarkCard(b, container) {
    const group = groups.find(g => g.id === b.group);
    const color = group ? group.color : 'var(--grey)';
    const url   = bookmarkUrl(b);
    const char  = iconChar(b.icon);

    const card = document.createElement('div');
    card.className = 'pixel-card';
    card.dataset.id = b.id;
    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', e => {
        dragSrcId      = b.id;
        dragSrcGroupId = b.group || null;
        setTimeout(() => card.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
        dragSrcId      = null;
        dragSrcGroupId = null;
    });

    card.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!dragSrcId || dragSrcId === b.id) return;
        const parent = card.parentElement;
        parent.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
        const rect = card.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
        placeholder.addEventListener('dragover', ev => ev.preventDefault());
        placeholder.addEventListener('drop', async ev => {
            ev.preventDefault();
            if (!dragSrcId) return;
            const section = placeholder.closest('.group-section');
            const gId = section ? (section.dataset.groupId || null) : null;
            await doDragReorder(placeholder, gId);
        });
        if (e.clientX < midX) {
            parent.insertBefore(placeholder, card);
        } else {
            parent.insertBefore(placeholder, card.nextSibling);
        }
    });

    card.addEventListener('drop', async e => {
        e.preventDefault();
        if (!dragSrcId || dragSrcId === b.id) return;
        const targetGroupId = b.group || null;
        await doDragReorder(card, targetGroupId);
    });

    card.style.borderTopColor = color;
    card.innerHTML = `
        <div class="card-icon"><span class="nf"></span></div>
        <h3>${escHtml(b.name)}</h3>
        <p class="card-url">${escHtml(url)}</p>
        <div class="card-actions">
            <button class="open-btn">Open</button>
        </div>`;

    const iconSpan = card.querySelector('.nf');
    iconSpan.textContent = char || '?';

    card.querySelector('.open-btn').addEventListener('click', () => window.open(url, '_blank'));
    container.appendChild(card);
    return card;
}

async function doDragReorder(targetCard, targetGroupId) {
    // Cross-group drag in grouped mode: update bookmark's group
    if (viewMode === 'grouped' && dragSrcGroupId !== targetGroupId) {
        const src = bookmarks.find(b => b.id === dragSrcId);
        if (src) {
            const putRes = await fetch(`/api/bookmarks/${dragSrcId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...src, group: targetGroupId }),
            });
            if (!putRes.ok) {
                await loadAll();
                return;
            }
        }
    }

    // Build new global order from DOM
    const parent = targetCard.parentElement;
    const siblings = [...parent.children];

    // Read card order from DOM (placeholder marks where dragSrc goes)
    const sectionOrder = [];
    siblings.forEach(el => {
        if (el.classList.contains('drag-placeholder')) {
            sectionOrder.push(dragSrcId);
        } else if (el.dataset.id && el.dataset.id !== dragSrcId) {
            sectionOrder.push(el.dataset.id);
        }
    });

    if (!sectionOrder.includes(dragSrcId)) return;

    // Merge: place the reordered section ids in place of their original positions
    const sectionSet = new Set(sectionOrder);
    const globalIds  = bookmarks.map(b => b.id);
    const firstIdx   = globalIds.findIndex(id => sectionSet.has(id));
    const newGlobal  = globalIds.filter(id => !sectionSet.has(id));
    newGlobal.splice(firstIdx, 0, ...sectionOrder);

    const postRes = await fetch('/api/bookmarks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: newGlobal }),
    });

    if (!postRes.ok) {
        await loadAll();
        return;
    }

    await loadAll();
}

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

// ── Settings: groups list ──────────────────────────────────────────────────────
function renderGroupsList() {
    const list = document.getElementById('groups-list');
    if (groups.length === 0) {
        list.innerHTML = '<p style="color:var(--grey);font-size:12px;">No groups yet.</p>';
        return;
    }
    list.innerHTML = '';
    groups.forEach(g => {
        const row = document.createElement('div');
        row.className = 'group-row';
        row.innerHTML = `
            <div class="group-swatch" style="background:${escHtml(g.color)}"></div>
            <span>${escHtml(g.name)}</span>
            <button class="edit-group-btn">Edit</button>
            <button class="del-group-btn">Delete</button>`;

        row.querySelector('.edit-group-btn').addEventListener('click', () => inlineEditGroup(row, g));
        row.querySelector('.del-group-btn').addEventListener('click', async () => {
            await fetch(`/api/groups/${g.id}`, { method: 'DELETE' });
            if (activeGroup === g.id) activeGroup = 'all';
            await loadAll();
        });
        list.appendChild(row);
    });
}

function inlineEditGroup(row, g) {
    row.innerHTML = `
        <input type="color" class="edit-color" value="${escHtml(g.color)}" style="width:36px;height:36px;border:2px solid var(--primary);padding:2px;cursor:pointer;">
        <input type="text" class="edit-name" value="${escHtml(g.name)}" style="flex:1;padding:6px;border:2px solid var(--primary);font-family:inherit;font-size:12px;background:var(--bg);">
        <button class="save-group-btn">Save</button>
        <button class="cancel-group-btn">Cancel</button>`;

    row.querySelector('.save-group-btn').addEventListener('click', async () => {
        const name  = row.querySelector('.edit-name').value.trim();
        const color = row.querySelector('.edit-color').value;
        if (!name) return;
        await fetch(`/api/groups/${g.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color }),
        });
        await loadAll();
    });
    row.querySelector('.cancel-group-btn').addEventListener('click', () => renderGroupsList());
}

// ── Settings: add group form ───────────────────────────────────────────────────
document.getElementById('form-add-group').addEventListener('submit', async e => {
    e.preventDefault();
    const name  = document.getElementById('group-name').value.trim();
    const color = document.getElementById('group-color').value;
    if (!name) return;
    await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
    });
    document.getElementById('group-name').value = '';
    await loadAll();
});

// ── Settings: bookmarks table ──────────────────────────────────────────────────
function renderBookmarksTable() {
    const wrap = document.getElementById('bookmarks-table');
    if (bookmarks.length === 0) {
        wrap.innerHTML = '<p style="color:var(--grey);font-size:12px;">No bookmarks yet.</p>';
        return;
    }
    const table = document.createElement('div');
    table.className = 'bookmarks-table';

    bookmarks.forEach(b => {
        const group = groups.find(g => g.id === b.group);
        const url   = bookmarkUrl(b);
        const char  = iconChar(b.icon);

        const row = document.createElement('div');
        row.className = 'bookmark-row';
        row.innerHTML = `
            <span class="bm-icon nf"></span>
            <span class="bm-name">${escHtml(b.name)}</span>
            <span class="bm-url">${escHtml(url)}${group ? ` · ${escHtml(group.name)}` : ''}</span>
            <button class="edit-btn">Edit</button>
            <button class="del-bm-btn">Delete</button>`;

        const iconEl = row.querySelector('.bm-icon');
        if (char) iconEl.textContent = char;
        else      iconEl.textContent = '?';

        row.querySelector('.edit-btn').addEventListener('click', () => openEditModal(b));
        row.querySelector('.del-bm-btn').addEventListener('click', async () => {
            await fetch(`/api/bookmarks/${b.id}`, { method: 'DELETE' });
            await loadAll();
        });
        table.appendChild(row);
    });
    wrap.innerHTML = '';
    wrap.appendChild(table);
}

// ── Settings: add bookmark form ────────────────────────────────────────────────
setupTypeToggle('bm-type', 'bm-port', 'bm-url');

document.getElementById('form-add-bookmark').addEventListener('submit', async e => {
    e.preventDefault();
    const name  = document.getElementById('bm-name').value.trim();
    const type  = document.querySelector('input[name="bm-type"]:checked').value;
    const port  = type === 'port' ? (parseInt(document.getElementById('bm-port').value) || null) : null;
    const url   = type === 'url'  ? (document.getElementById('bm-url').value.trim() || null) : null;
    const icon  = document.getElementById('bm-icon').value || null;
    const group = document.getElementById('bm-group').value || null;
    if (!name) return;
    await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, port, url, icon, group }),
    });
    document.getElementById('form-add-bookmark').reset();
    document.getElementById('bm-icon').value = '';
    setupTypeToggle('bm-type', 'bm-port', 'bm-url');
    renderIconGrid('bm-icon-search', 'bm-icon-grid', 'bm-icon');
    await loadAll();
});

// ── Edit bookmark modal ────────────────────────────────────────────────────────
setupTypeToggle('edit-bm-type', 'edit-bm-port', 'edit-bm-url');

function openEditModal(b) {
    document.getElementById('edit-bm-id').value   = b.id;
    document.getElementById('edit-bm-name').value = b.name;

    const isPort = !!b.port;
    const portRadio = document.querySelector('input[name="edit-bm-type"][value="port"]');
    const urlRadio  = document.querySelector('input[name="edit-bm-type"][value="url"]');
    portRadio.checked = isPort;
    urlRadio.checked  = !isPort;
    document.getElementById('edit-bm-port').value = b.port || '';
    document.getElementById('edit-bm-url').value  = b.url  || '';
    document.getElementById('edit-bm-port').classList.toggle('hidden', !isPort);
    document.getElementById('edit-bm-url').classList.toggle('hidden', isPort);

    document.getElementById('edit-bm-icon').value = b.icon || '';
    document.getElementById('edit-bm-group').value = b.group || '';
    renderIconGrid('edit-icon-search', 'edit-icon-grid', 'edit-bm-icon');

    document.getElementById('edit-modal').classList.remove('hidden');
}

document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    document.getElementById('edit-modal').classList.add('hidden');
});

document.getElementById('edit-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-modal'))
        document.getElementById('edit-modal').classList.add('hidden');
});

document.getElementById('form-edit-bookmark').addEventListener('submit', async e => {
    e.preventDefault();
    const id    = document.getElementById('edit-bm-id').value;
    const name  = document.getElementById('edit-bm-name').value.trim();
    const type  = document.querySelector('input[name="edit-bm-type"]:checked').value;
    const port  = type === 'port' ? (parseInt(document.getElementById('edit-bm-port').value) || null) : null;
    const url   = type === 'url'  ? (document.getElementById('edit-bm-url').value.trim() || null) : null;
    const icon  = document.getElementById('edit-bm-icon').value || null;
    const group = document.getElementById('edit-bm-group').value || null;
    if (!name) return;
    await fetch(`/api/bookmarks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, port, url, icon, group }),
    });
    document.getElementById('edit-modal').classList.add('hidden');
    await loadAll();
});

// ── Scan → Add to Dashboard modal ─────────────────────────────────────────────
document.getElementById('btn-cancel-scan-add').addEventListener('click', () => {
    document.getElementById('scan-add-modal').classList.add('hidden');
});

document.getElementById('scan-add-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('scan-add-modal'))
        document.getElementById('scan-add-modal').classList.add('hidden');
});

document.getElementById('form-scan-add').addEventListener('submit', async e => {
    e.preventDefault();
    const port  = parseInt(document.getElementById('scan-add-port').value);
    const name  = document.getElementById('scan-add-name').value.trim();
    const icon  = document.getElementById('scan-add-icon').value || null;
    const group = document.getElementById('scan-add-group').value || null;
    if (!name) return;
    await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, port, icon, group }),
    });
    document.getElementById('scan-add-modal').classList.add('hidden');
    await loadAll();
});

function openScanAddModal(port, service) {
    document.getElementById('scan-add-port').value  = port;
    document.getElementById('scan-add-name').value  = service || `Port ${port}`;
    document.getElementById('scan-add-icon').value  = '';
    document.getElementById('scan-add-group').value = '';
    renderIconGrid('scan-add-icon-search', 'scan-add-icon-grid', 'scan-add-icon');
    populateGroupDropdowns();
    document.getElementById('scan-add-modal').classList.remove('hidden');
}

// ── Group dropdowns ────────────────────────────────────────────────────────────
function populateGroupDropdowns(selectedId) {
    const selects = ['bm-group', 'edit-bm-group', 'scan-add-group'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        const val = selectedId !== undefined ? selectedId : sel.value;
        sel.innerHTML = '<option value="">No group</option>';
        groups.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.name;
            if (g.id === val) opt.selected = true;
            sel.appendChild(opt);
        });
    });
}

// ── Type toggle (port/url) ─────────────────────────────────────────────────────
function setupTypeToggle(radioName, portId, urlId) {
    const radios = document.querySelectorAll(`input[name="${radioName}"]`);
    radios.forEach(r => r.addEventListener('change', () => {
        const isPort = document.querySelector(`input[name="${radioName}"]:checked`).value === 'port';
        document.getElementById(portId).classList.toggle('hidden', !isPort);
        document.getElementById(urlId).classList.toggle('hidden', isPort);
    }));
    // Initial state
    const isPort = document.querySelector(`input[name="${radioName}"]:checked`).value === 'port';
    document.getElementById(portId).classList.toggle('hidden', !isPort);
    document.getElementById(urlId).classList.toggle('hidden', isPort);
}

// ── Icon picker ────────────────────────────────────────────────────────────────
function renderIconGrid(searchId, gridId, hiddenId, filter) {
    const grid   = document.getElementById(gridId);
    const hidden = document.getElementById(hiddenId);
    const query  = (filter || '').toLowerCase();
    const selected = hidden.value;

    const entries = Object.entries(ICONS).filter(([name]) =>
        !query || name.toLowerCase().includes(query)
    );

    grid.innerHTML = '';
    entries.forEach(([name, char]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-btn' + (name === selected ? ' selected' : '');
        btn.title = name;
        const iconSpan = document.createElement('span');
        iconSpan.className = 'nf';
        iconSpan.textContent = char;
        const label = document.createElement('span');
        label.className = 'icon-label';
        label.textContent = name.replace(/^nf-[a-z]+-/, '');
        btn.appendChild(iconSpan);
        btn.appendChild(label);
        btn.addEventListener('click', () => {
            hidden.value = name;
            grid.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        grid.appendChild(btn);
    });
}

function setupIconPicker(searchId, gridId, hiddenId) {
    renderIconGrid(searchId, gridId, hiddenId);
    document.getElementById(searchId).addEventListener('input', e => {
        renderIconGrid(searchId, gridId, hiddenId, e.target.value);
    });
}

setupIconPicker('bm-icon-search',       'bm-icon-grid',       'bm-icon');
setupIconPicker('edit-icon-search',     'edit-icon-grid',     'edit-bm-icon');
setupIconPicker('scan-add-icon-search', 'scan-add-icon-grid', 'scan-add-icon');

// ── Scan preset buttons ────────────────────────────────────────────────────────
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
                `Scan Ports 1\u2013${scanEndPort.toLocaleString()}`;
        }
    });
});

document.getElementById('btn-scan-custom').addEventListener('click', startScan);
document.getElementById('btn-scan-default').addEventListener('click', startScan);
document.getElementById('btn-stop-scan').addEventListener('click', () => { stopRequested = true; });

// ── Batch scan ─────────────────────────────────────────────────────────────────
const BATCH_SIZE = 100;

async function startScan() {
    stopRequested = false;
    const isCustom = !!document.querySelector('.preset-btn.active[data-custom="true"]');
    const start = isCustom ? (parseInt(document.getElementById('scan-start').value) || 1) : 1;
    const end   = isCustom ? (parseInt(document.getElementById('scan-end').value)   || 9999) : scanEndPort;

    if (start > end) { alert('Start port must be \u2264 end port.'); return; }

    document.getElementById('scan-results').innerHTML = '';
    document.getElementById('scan-progress-area').classList.remove('hidden');
    document.getElementById('btn-scan-default').classList.add('hidden');
    document.getElementById('btn-scan-custom').classList.add('hidden');
    document.getElementById('btn-stop-scan').classList.remove('hidden');
    setProgress(0, end - start + 1, 0);

    let scanned = 0;
    let found   = 0;
    const resultsContainer = document.getElementById('scan-results');

    for (let batchStart = start; batchStart <= end; batchStart += BATCH_SIZE) {
        if (stopRequested) break;
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, end);
        try {
            const res = await fetch(`/api/scanner?start=${batchStart}&end=${batchEnd}`);
            const services = await res.json();
            services.forEach(s => { addScanCard(s.port, s.service, resultsContainer); found++; });
        } catch (err) {
            console.error('Batch failed:', batchStart, err);
        }
        scanned += batchEnd - batchStart + 1;
        setProgress(scanned, end - start + 1, found);
    }

    document.getElementById('btn-stop-scan').classList.add('hidden');
    if (isCustom) {
        document.getElementById('btn-scan-custom').classList.remove('hidden');
    } else {
        document.getElementById('btn-scan-default').classList.remove('hidden');
    }
    document.getElementById('progress-text').textContent = stopRequested
        ? `Stopped \u00B7 ${found} service${found !== 1 ? 's' : ''} found`
        : `Done \u00B7 ${found} service${found !== 1 ? 's' : ''} found`;
}

function setProgress(scanned, total, found) {
    const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
    document.getElementById('progress-bar-inner').style.width = pct + '%';
    document.getElementById('progress-text').textContent = `Scanning\u2026 ${pct}%`;
    document.getElementById('progress-count').textContent =
        `${scanned.toLocaleString()} / ${total.toLocaleString()} ports \u00B7 ${found} found`;
}

function addScanCard(port, service, container) {
    const card = document.createElement('div');
    card.className = 'scan-card';
    card.innerHTML = `
        <h3>:${port} ${escHtml(service || 'Unknown')}</h3>
        <p>localhost:${port}</p>
        <button class="add-dashboard-btn">+ Dashboard</button>`;
    card.querySelector('.add-dashboard-btn').addEventListener('click', () => {
        openScanAddModal(port, service || '');
    });
    container.appendChild(card);
}

// ── Suggestions Tab Configuration ────────────────────────────────────────────
const SUGGESTIONS_CONFIG = {
    backendUrl: 'http://localhost:7421',
    cacheKey: 'bookmark_suggestions_cache',
    maxSuggestions: 10
};

// ── Suggestions Tab Navigation ───────────────────────────────────────────────
document.getElementById('nav-suggestions').addEventListener('click', () => switchView('suggestions'));

// ── Suggestions Tab Logic ─────────────────────────────────────────────────────
let suggestionsCache = null;
let suggestionsLoaded = false;

function getSuggestionsFromCache() {
    try {
        const cached = sessionStorage.getItem(SUGGESTIONS_CONFIG.cacheKey);
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < 3600000) { // 1 hour cache
                return data.suggestions;
            }
        }
    } catch (e) {
        console.warn('Cache read failed:', e);
    }
    return null;
}

function setSuggestionsCache(suggestions) {
    try {
        sessionStorage.setItem(SUGGESTIONS_CONFIG.cacheKey, JSON.stringify({
            suggestions: suggestions,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.warn('Cache write failed:', e);
    }
}

async function loadSuggestions(forceRefresh = false) {
    const loadingDiv = document.getElementById('suggestions-loading');
    const errorDiv = document.getElementById('suggestions-error');
    const listDiv = document.getElementById('suggestions-list');
    const statusDiv = document.getElementById('suggestions-status');

    // Reset UI
    loadingDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    listDiv.innerHTML = '';

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cached = getSuggestionsFromCache();
        if (cached && cached.length > 0) {
            renderSuggestions(cached);
            statusDiv.textContent = 'Showing cached suggestions';
            loadingDiv.classList.add('hidden');
            return;
        }
    }

    try {
        const response = await fetch(`${SUGGESTIONS_CONFIG.backendUrl}/suggestions`);
        
        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.suggestions || data.suggestions.length === 0) {
            throw new Error('No suggestions received');
        }

        // Cache the results
        setSuggestionsCache(data.suggestions);
        renderSuggestions(data.suggestions);
        statusDiv.textContent = `Loaded ${data.count} suggestions`;

    } catch (err) {
        console.error('Failed to load suggestions:', err);
        statusDiv.textContent = '';
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = `Could not load suggestions: ${err.message}. Make sure the Python backend is running on ${SUGGESTIONS_CONFIG.backendUrl}`;
        errorDiv.classList.remove('hidden');
    }
}

function renderSuggestions(suggestions) {
    const listDiv = document.getElementById('suggestions-list');
    listDiv.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
        listDiv.innerHTML = `<div class="empty-state">
            <div class="empty-pixel">[_]</div>
            <p>No suggestions available.</p>
            <p class="empty-hint">Make sure Firefox has browsing history and backend is running.</p>
        </div>`;
        return;
    }

    suggestions.forEach(s => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';

        const categoryColor = getCategoryColor(s.category);
        card.style.borderTopColor = categoryColor;

        // Use a generic icon for suggestions (globe)
        const iconChar = '\uF0AC'; // globe icon

        card.innerHTML = `
            <div class="card-icon"><span class="nf">${iconChar}</span></div>
            <h3>${escHtml(s.title)}</h3>
            <p class="suggestion-url">${escHtml(s.url)}</p>
            <p class="suggestion-badge" style="background:${categoryColor};color:#2c3e50">${escHtml(s.category || 'General')}</p>
            <p class="suggestion-desc">${escHtml(s.description || '')}</p>
            <div class="suggestion-actions">
                <button class="open-suggestion-btn" data-url="${escHtml(s.url)}">Open</button>
                <button class="add-bm-btn" data-title="${escHtml(s.title)}" data-url="${escHtml(s.url)}" data-category="${escHtml(s.category || '')}">Add</button>
            </div>`;

        // Open button
        card.querySelector('.open-suggestion-btn').addEventListener('click', () => {
            window.open(s.url, '_blank');
        });

        // Add to Dashboard button
        card.querySelector('.add-bm-btn').addEventListener('click', (e) => {
            const title = e.target.dataset.title;
            const url = e.target.dataset.url;
            const category = e.target.dataset.category;
            addSuggestionAsBookmark(title, url, category);
        });

        listDiv.appendChild(card);
    });

    suggestionsLoaded = true;
}

function getCategoryColor(category) {
    const categories = {
        'Geliştirici': '#27ae60',  // green
        'Araştırma': '#2980b9',     // blue
        'Verimlilik': '#f39c12',     // yellow
        'Eğlence': '#c0392b',       // red
        'Sosyal': '#9b59b6',        // purple
        'Haber': '#3498db',         // light blue
        'Genel': '#95a5a6'          // grey
    };

    for (const key in categories) {
        if (category && category.toLowerCase().includes(key.toLowerCase())) {
            return categories[key];
        }
    }
    return 'var(--yellow)';
}

async function addSuggestionAsBookmark(title, url, category) {
    // Get first group or create default
    const groupsArray = groups.length > 0 ? groups : [];
    const defaultGroup = groupsArray.length > 0 ? groupsArray[0].id : '';

    // Create bookmark object
    const bookmark = {
        name: title,
        url: url,
        port: null,
        icon: 'nf-fa-globe',  // Use globe icon for suggestions
        group: defaultGroup
    };

    try {
        const response = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookmark)
        });

        if (!response.ok) {
            throw new Error('Failed to add bookmark');
        }

        // Reload data
        await loadAll();

        // Show confirmation
        alert(`Added "${title}" to Dashboard!`);

    } catch (err) {
        console.error('Failed to add bookmark:', err);
        alert(`Could not add bookmark: ${err.message}`);
    }
}

// ── Refresh Button ─────────────────────────────────────────────────────────────
document.getElementById('btn-refresh-suggestions').addEventListener('click', () => {
    document.getElementById('suggestions-status').textContent = 'Refreshing...';
    loadSuggestions(true);
});

// ── Init Suggestions Tab ───────────────────────────────────────────────────────
document.getElementById('view-suggestions').addEventListener('click', () => {
    // Load suggestions when tab is first accessed
    if (!suggestionsLoaded) {
        loadSuggestions(false);
    }
});

// ── Init ───────────────────────────────────────────────────────────────────────
setInitialModeBtn();
loadAll();
