/* =====================================================
   scores.js – Leaderboard page: Read, Update, Delete
   Depends on: storage.js, db.js, common.js
   ===================================================== */

// ---- DOM refs ----
const sortSelect     = document.getElementById('sortSelect');
const clearAllBtn    = document.getElementById('clearAllBtn');
const scoresBody     = document.getElementById('scoresBody');
const emptyScoresMsg = document.getElementById('emptyScoresMsg');
const scoresTable    = document.getElementById('scoresTable');

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  renderScores(sortSelect.value);

  sortSelect.addEventListener('change', () => renderScores(sortSelect.value));
  clearAllBtn.addEventListener('click', handleClearAll);
});

// ---- Render scores table ----
async function renderScores(sortKey = 'score') {
  let scores;
  try {
    scores = await getAllScores();
  } catch (err) {
    scoresBody.innerHTML = `<tr><td colspan="9" style="color:var(--danger);text-align:center">
      Could not load scores. Storage may be restricted in private mode.</td></tr>`;
    console.error(err);
    return;
  }

  if (!scores.length) {
    scoresTable.hidden   = true;
    emptyScoresMsg.hidden = false;
    return;
  }

  scoresTable.hidden    = false;
  emptyScoresMsg.hidden = true;

  // Sort – highest first for numeric, newest first for date
  scores.sort((a, b) => {
    if (sortKey === 'date') {
      return b.date.localeCompare(a.date);
    }
    return b[sortKey] - a[sortKey];
  });

  scoresBody.innerHTML = scores.map((s, i) => {
    const rank   = i + 1;
    const badge  = rankBadge(rank);
    const diff   = diffBadge(s.difficulty);

    return `
      <tr>
        <td>${badge}</td>
        <td id="player-cell-${s.id}">${escHtml(s.player)}</td>
        <td>${escHtml(s.pack)}</td>
        <td>${diff}</td>
        <td><strong>${s.score}</strong></td>
        <td>${s.wpm}</td>
        <td>${s.accuracy}%</td>
        <td>${s.date}</td>
        <td>
          <div class="score-actions">
            <button class="btn btn--secondary btn--small" onclick="editPlayer(${s.id})" aria-label="Edit player name for rank ${rank}">✏️</button>
            <button class="btn btn--ghost    btn--small" onclick="removeScore(${s.id})"  aria-label="Delete score for rank ${rank}">🗑</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ---- Update: edit player name ----
async function editPlayer(id) {
  const cell = document.getElementById(`player-cell-${id}`);
  const current = cell ? cell.textContent.trim() : '';

  const newName = prompt('Enter new player name (1–15 characters):', current);
  if (newName === null) return; // cancelled

  const trimmed = newName.trim();
  if (!trimmed || trimmed.length > 15) {
    alert('Name must be 1–15 characters.');
    return;
  }

  try {
    await updateScore(id, { player: trimmed });
    renderScores(sortSelect.value);
  } catch (err) {
    alert('Could not update score.');
    console.error(err);
  }
}

// ---- Delete: single score ----
async function removeScore(id) {
  if (!confirm('Delete this score?')) return;
  try {
    await deleteScore(id);
    renderScores(sortSelect.value);
  } catch (err) {
    alert('Could not delete score.');
    console.error(err);
  }
}

// ---- Delete: all scores ----
async function handleClearAll() {
  if (!confirm('Clear ALL scores? This cannot be undone.')) return;
  try {
    await clearScores();
    renderScores(sortSelect.value);
  } catch (err) {
    alert('Could not clear scores.');
    console.error(err);
  }
}

// ---- Helpers ----
function rankBadge(rank) {
  if (rank === 1) return '<span class="rank-badge rank-badge--gold">1</span>';
  if (rank === 2) return '<span class="rank-badge rank-badge--silver">2</span>';
  if (rank === 3) return '<span class="rank-badge rank-badge--bronze">3</span>';
  return `<span class="rank-badge">${rank}</span>`;
}

function diffBadge(difficulty) {
  const cls = { Easy: 'easy', Medium: 'medium', Hard: 'hard' }[difficulty] || 'easy';
  return `<span class="badge badge--${cls}">${difficulty}</span>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
