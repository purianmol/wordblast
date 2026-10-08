/* =====================================================
   packs.js – Word Packs page: Create, Read, Update, Delete
   Depends on: storage.js, common.js
   ===================================================== */

// ---- DOM refs ----
const packForm         = document.getElementById('packForm');
const packFormTitle    = document.getElementById('packFormTitle');
const packNameInput    = document.getElementById('packNameInput');
const packWordsInput   = document.getElementById('packWordsInput');
const packNameError    = document.getElementById('packNameError');
const packWordsError   = document.getElementById('packWordsError');
const packDupNote      = document.getElementById('packDupNote');
const savePackBtn      = document.getElementById('savePackBtn');
const cancelPackBtn    = document.getElementById('cancelPackBtn');
const packGrid         = document.getElementById('packGrid');
const emptyPacksMsg    = document.getElementById('emptyPacksMsg');
const restoreDefaultsBtn = document.getElementById('restoreDefaultsBtn');

let editingId = null;  // null = create mode; number = edit mode

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  seedDefaultPacks();
  renderPacks();

  packForm.addEventListener('submit', handleSave);
  cancelPackBtn.addEventListener('click', resetForm);
  restoreDefaultsBtn.addEventListener('click', handleRestoreDefaults);
});

// ---- Render pack cards ----
function renderPacks() {
  const packs = getPacks();
  // Remove old cards (keep empty-state element)
  packGrid.querySelectorAll('.pack-card').forEach(el => el.remove());

  if (!packs.length) {
    emptyPacksMsg.hidden = false;
    return;
  }
  emptyPacksMsg.hidden = true;

  packs.forEach(pack => {
    const card = document.createElement('div');
    card.className = 'pack-card';
    card.dataset.id = pack.id;

    // Word chips (show first 8, then "+N more")
    const displayWords = pack.words.slice(0, 8);
    const remaining    = pack.words.length - displayWords.length;
    const chips = displayWords
      .map(w => `<span class="chip">${w}</span>`)
      .join('');
    const moreChip = remaining > 0
      ? `<span class="chip chip--more">+${remaining} more</span>`
      : '';

    card.innerHTML = `
      <div>
        <div class="pack-card__name">${escHtml(pack.name)}</div>
        <div class="pack-card__count">${pack.words.length} word${pack.words.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="pack-card__chips">${chips}${moreChip}</div>
      <div class="pack-card__actions">
        <button class="btn btn--secondary btn--small" data-action="edit" data-id="${pack.id}" aria-label="Edit ${escHtml(pack.name)}">✏️ Edit</button>
        <button class="btn btn--ghost    btn--small" data-action="delete" data-id="${pack.id}" aria-label="Delete ${escHtml(pack.name)}">🗑 Delete</button>
      </div>
    `;

    packGrid.appendChild(card);
  });

  // Delegate events on the grid
  packGrid.addEventListener('click', handleGridClick);
}

function handleGridClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id     = Number(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === 'edit')   editPack(id);
  if (action === 'delete') deletePack(id);
}

// ---- Save (create or update) ----
function handleSave(e) {
  e.preventDefault();
  const name    = packNameInput.value.trim();
  const rawText = packWordsInput.value;

  const { words, dupRemoved } = parseWords(rawText);
  const errors = validatePack(name, words, editingId);

  packNameError.textContent  = errors.name  || '';
  packWordsError.textContent = errors.words || '';

  if (errors.name || errors.words) return;

  // Show duplicate note if any were removed
  packDupNote.textContent = dupRemoved > 0
    ? `ℹ️ ${dupRemoved} duplicate word${dupRemoved > 1 ? 's' : ''} removed automatically.`
    : '';

  const packs = getPacks();

  if (editingId === null) {
    // CREATE
    packs.push({ id: Date.now(), name, words });
  } else {
    // UPDATE
    const idx = packs.findIndex(p => p.id === editingId);
    if (idx !== -1) packs[idx] = { ...packs[idx], name, words };
  }

  savePacks(packs);
  resetForm();
  renderPacks();
}

// ---- Edit a pack ----
function editPack(id) {
  const pack = getPacks().find(p => p.id === id);
  if (!pack) return;

  editingId = id;
  packFormTitle.textContent    = 'Edit Pack';
  savePackBtn.textContent      = '💾 Update Pack';
  packNameInput.value          = pack.name;
  packWordsInput.value         = pack.words.join('\n');
  packNameError.textContent    = '';
  packWordsError.textContent   = '';
  packDupNote.textContent      = '';

  // Scroll to form
  packForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  packNameInput.focus();
}

// ---- Delete a pack ----
function deletePack(id) {
  const packs = getPacks();
  if (packs.length <= 1) {
    alert('Keep at least one pack to play.');
    return;
  }
  const pack = packs.find(p => p.id === id);
  if (!pack) return;

  if (!confirm(`Delete the pack "${pack.name}"? This cannot be undone.`)) return;

  savePacks(packs.filter(p => p.id !== id));

  // If currently editing this pack, reset form
  if (editingId === id) resetForm();

  renderPacks();
}

// ---- Restore defaults ----
function handleRestoreDefaults() {
  if (!confirm('Restore the 3 default packs? Your custom packs will not be removed.')) return;
  const packs     = getPacks();
  const defaultIds = [1, 2, 3];

  // Only restore packs that don't already exist (by id)
  resetDefaultPacks();   // rewrites all 3 defaults into storage
  // Merge: keep custom packs + defaults (deduplicate by id)
  const existing  = packs.filter(p => !defaultIds.includes(p.id));
  const defaults  = getPacks().filter(p => defaultIds.includes(p.id));
  savePacks([...defaults, ...existing]);

  renderPacks();
}

// ---- Reset form ----
function resetForm() {
  editingId = null;
  packFormTitle.textContent  = 'Create New Pack';
  savePackBtn.textContent    = '💾 Save Pack';
  packForm.reset();
  packNameError.textContent  = '';
  packWordsError.textContent = '';
  packDupNote.textContent    = '';
}

// ---- Parse words from textarea ----
function parseWords(raw) {
  const all = raw
    .split(/[\n,]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0);

  const unique  = [...new Set(all)];
  return { words: unique, dupRemoved: all.length - unique.length };
}

// ---- Validate pack ----
function validatePack(name, words, editingId) {
  const errors = {};
  const packs  = getPacks();

  // Name
  if (!name || name.length < 3 || name.length > 30) {
    errors.name = 'Pack name must be 3–30 characters.';
  } else {
    const duplicate = packs.some(
      p => p.name.toLowerCase() === name.toLowerCase() && p.id !== editingId
    );
    if (duplicate) errors.name = 'A pack with this name already exists.';
  }

  // Words
  if (!words.length || words.length < 5) {
    errors.words = 'Add at least 5 words.';
  } else if (words.length > 100) {
    errors.words = 'Maximum 100 words allowed.';
  } else {
    const invalid = words.find(w => !/^[a-z]{2,15}$/.test(w));
    if (invalid) errors.words = `"${invalid}" is invalid – words can only contain letters (2–15 each).`;
  }

  return errors;
}

// ---- Utility: escape HTML ----
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
