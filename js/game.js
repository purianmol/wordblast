/* =====================================================
   game.js – Game loop, spawning, input matching, scoring
   Depends on: storage.js, db.js, common.js
   ===================================================== */

// ---- Difficulty config ----
const DIFFICULTY_CONFIG = {
  easy:   { baseSpeed: 9,  baseGap: 2.5, maxWords: 4  },
  medium: { baseSpeed: 13, baseGap: 2.0, maxWords: 6  },
  hard:   { baseSpeed: 19, baseGap: 1.5, maxWords: 8  }
};

// ---- Game state ----
const state = {
  status:    'idle',   // idle | running | paused | gameover
  words:     [],       // falling word objects { text, x, y, el }
  pool:      [],       // shuffled word list for the chosen pack
  poolIndex: 0,
  score:     0,
  level:     1,
  lives:     3,
  combo:     1,
  destroyed: 0,
  missed:    0,
  wrong:     0,
  letters:   0,
  activeMs:  0,
  spawnTimer: 0
};

let difficulty = 'medium';
let playerName = '';
let packName   = '';
let lastTime   = null;
let rafId      = null;

// ---- DOM refs ----
const setupPanel     = document.getElementById('setupPanel');
const gameArea       = document.getElementById('gameArea');
const gameCanvas     = document.getElementById('gameCanvas');
const packSelect     = document.getElementById('packSelect');
const diffSelect     = document.getElementById('difficultySelect');
const playerInput    = document.getElementById('playerNameInput');
const playerError    = document.getElementById('playerNameError');
const startBtn       = document.getElementById('startBtn');
const typingInput    = document.getElementById('typingInput');
const pauseBtn       = document.getElementById('pauseBtn');
const restartBtn     = document.getElementById('restartBtn');
const statScore      = document.getElementById('statScore');
const statLevel      = document.getElementById('statLevel');
const statLives      = document.getElementById('statLives');
const statWpm        = document.getElementById('statWpm');
const statAccuracy   = document.getElementById('statAccuracy');
const gameOverOverlay= document.getElementById('gameOverOverlay');
const gameOverStats  = document.getElementById('gameOverStats');
const saveScoreBtn   = document.getElementById('saveScoreBtn');
const playAgainBtn   = document.getElementById('playAgainBtn');
const saveError      = document.getElementById('saveError');
const saveSuccess    = document.getElementById('saveSuccess');
const levelUpBanner  = document.getElementById('levelUpBanner');

// ---- Computed difficulty values ----
function cfg()      { return DIFFICULTY_CONFIG[difficulty]; }
function baseSpeed(){ return cfg().baseSpeed; }
function baseGap()  { return cfg().baseGap; }
function maxWords() { return cfg().maxWords; }
function speed()    { return baseSpeed() * (1 + 0.15 * (state.level - 1)); }
function spawnGap() { return Math.max(0.8, baseGap() - 0.15 * (state.level - 1)); }

// ---- Initialise page ----
document.addEventListener('DOMContentLoaded', () => {
  seedDefaultPacks();
  populatePackSelect();
  prefillSetup();

  startBtn.addEventListener('click', handleStart);
  pauseBtn.addEventListener('click', togglePause);
  restartBtn.addEventListener('click', handleRestart);
  typingInput.addEventListener('input', handleInput);
  typingInput.addEventListener('keydown', handleKeydown);
  saveScoreBtn.addEventListener('click', handleSaveScore);
  playAgainBtn.addEventListener('click', handlePlayAgain);

  // Auto-pause when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.status === 'running') pauseGame();
  });
});

// ---- Populate pack <select> ----
function populatePackSelect() {
  const packs = getPacks();
  packSelect.innerHTML = '';
  if (!packs.length) {
    packSelect.innerHTML = '<option value="">No packs – create one first!</option>';
    startBtn.disabled = true;
    return;
  }
  startBtn.disabled = false;
  packs.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    packSelect.appendChild(opt);
  });
}

// ---- Pre-fill from sessionStorage + cookie ----
function prefillSetup() {
  const setup = loadSetup();
  if (setup) {
    if (packSelect.querySelector(`option[value="${setup.packId}"]`)) {
      packSelect.value = String(setup.packId);
    }
    if (setup.difficulty) diffSelect.value = setup.difficulty;
  }
  const savedName = getCookie('wb_player');
  if (savedName) playerInput.value = savedName;
}

// ---- Start game ----
function handleStart() {
  const name = playerInput.value.trim();
  if (!name || name.length > 15) {
    playerError.textContent = 'Enter a name (max 15 characters).';
    playerInput.focus();
    return;
  }
  playerError.textContent = '';

  const packId  = Number(packSelect.value);
  const packs   = getPacks();
  const pack    = packs.find(p => p.id === packId);
  if (!pack) { alert('Please select a valid word pack.'); return; }

  difficulty = diffSelect.value;
  playerName = name;
  packName   = pack.name;

  // Persist choices
  saveSetup({ packId, difficulty });
  setCookie('wb_player', name, 365);

  // Shuffle pool
  state.pool = shuffle([...pack.words]);
  state.poolIndex = 0;

  resetState();
  setupPanel.hidden = true;
  gameArea.hidden   = false;
  typingInput.focus();
  startLoop();
}

// ---- Game loop ----
function startLoop() {
  state.status = 'running';
  lastTime = null;
  rafId = requestAnimationFrame(gameLoop);
}

function gameLoop(now) {
  if (state.status !== 'running') return;

  if (lastTime === null) lastTime = now;
  const dt = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms to avoid big jumps
  lastTime = now;

  state.activeMs  += dt * 1000;
  state.spawnTimer += dt;

  if (state.spawnTimer >= spawnGap() && state.words.length < maxWords()) {
    spawnWord();
    state.spawnTimer = 0;
  }

  moveWords(dt);
  updateStats();

  rafId = requestAnimationFrame(gameLoop);
}

// ---- Spawn a word ----
function spawnWord() {
  // Cycle through shuffled pool, re-shuffle when exhausted
  if (state.poolIndex >= state.pool.length) {
    state.pool = shuffle([...state.pool]);
    state.poolIndex = 0;
  }
  const text = state.pool[state.poolIndex++];

  // Avoid duplicate text on screen
  if (state.words.some(w => w.text === text)) return;

  const x = 5 + Math.random() * 75; // 5%–80% from left

  const el = document.createElement('div');
  el.className   = 'word';
  el.textContent = text;
  el.style.left  = x + '%';
  el.style.top   = '0%';
  gameCanvas.appendChild(el);

  state.words.push({ text, x, y: 0, el });
}

// ---- Move words ----
function moveWords(dt) {
  const s = speed();
  for (let i = state.words.length - 1; i >= 0; i--) {
    const w = state.words[i];
    w.y += s * dt;
    w.el.style.top = w.y + '%';

    if (w.y >= 97) {  // reached danger line
      missWord(w, i);
    }
  }
}

// ---- Handle typing ----
function handleInput() {
  const typed   = typingInput.value.trim().toLowerCase();
  const matches = state.words.filter(w => w.text === typed);

  if (matches.length) {
    // If same word on screen twice, destroy the lowest one
    const target = matches.reduce((a, b) => (a.y > b.y ? a : b));
    destroyWord(target);
    typingInput.value = '';
  } else {
    // Highlight partial match
    state.words.forEach(w => {
      w.el.classList.toggle('word--highlight', w.text.startsWith(typed) && typed.length > 0);
    });
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter') {
    const typed = typingInput.value.trim().toLowerCase();
    if (typed && !state.words.some(w => w.text === typed)) {
      // Wrong attempt
      state.wrong++;
      state.combo = 1;
      typingInput.value = '';
      // Clear any highlights
      state.words.forEach(w => w.el.classList.remove('word--highlight'));
    }
  }
}

// ---- Destroy a word ----
function destroyWord(word) {
  const points = word.text.length * 10 + (state.combo - 1) * 5;
  state.score   += points;
  state.combo    = Math.min(state.combo + 1, 10);
  state.destroyed++;
  state.letters += word.text.length;

  // Pop animation then remove
  word.el.classList.add('word--pop');
  setTimeout(() => word.el.remove(), 220);

  // Remove from state
  state.words = state.words.filter(w => w !== word);

  // Level up every 10 words
  if (state.destroyed % 10 === 0) levelUp();
}

// ---- Miss a word ----
function missWord(word, idx) {
  state.lives--;
  state.missed++;
  state.combo = 1;

  word.el.classList.add('word--miss');
  setTimeout(() => word.el.remove(), 360);

  state.words.splice(idx, 1);
  updateHeartsWithPulse();

  if (state.lives <= 0) endGame();
}

// ---- Level up ----
function levelUp() {
  state.level++;
  // Show brief banner
  levelUpBanner.textContent = `🚀 Level ${state.level}!`;
  levelUpBanner.hidden = false;
  // Banner auto-hides via CSS animation (1.5s), then reset
  setTimeout(() => { levelUpBanner.hidden = true; }, 1600);
}

// ---- Update stats bar ----
function updateStats() {
  statScore.textContent = state.score;
  statLevel.textContent = state.level;
  statWpm.textContent   = calcWpm();
  statAccuracy.textContent = calcAccuracy() + '%';
}

function updateHeartsWithPulse() {
  const hearts = '❤️'.repeat(Math.max(state.lives, 0)) || '💔';
  statLives.textContent = hearts;
  statLives.classList.add('heart-pulse');
  setTimeout(() => statLives.classList.remove('heart-pulse'), 400);
}

// ---- Formulas ----
function calcWpm() {
  const minutes = state.activeMs / 60000;
  if (minutes < 5 / 60) return 0;  // hide for first 5 s
  return Math.round((state.letters / 5) / minutes);
}

function calcAccuracy() {
  const total = state.destroyed + state.missed + state.wrong;
  if (total === 0) return 100;
  return Math.round((state.destroyed / total) * 100);
}

// ---- Pause / Resume ----
function togglePause() {
  if (state.status === 'running') pauseGame();
  else if (state.status === 'paused') resumeGame();
}

function pauseGame() {
  state.status = 'paused';
  pauseBtn.textContent = 'Resume';
  cancelAnimationFrame(rafId);
}

function resumeGame() {
  state.status = 'running';
  pauseBtn.textContent = 'Pause';
  lastTime = null;
  rafId = requestAnimationFrame(gameLoop);
}

// ---- Restart ----
function handleRestart() {
  cancelAnimationFrame(rafId);
  clearWords();
  resetState();
  updateStats();
  statLives.textContent = '❤️❤️❤️';
  pauseBtn.textContent = 'Pause';
  typingInput.value = '';
  startLoop();
}

// ---- Game over ----
function endGame() {
  state.status = 'gameover';
  cancelAnimationFrame(rafId);
  clearWords();

  // Populate game-over dialog
  gameOverStats.innerHTML = `
    <div class="dialog__stat">
      <div class="dialog__stat-label">Score</div>
      <div class="dialog__stat-value">${state.score}</div>
    </div>
    <div class="dialog__stat">
      <div class="dialog__stat-label">Level</div>
      <div class="dialog__stat-value">${state.level}</div>
    </div>
    <div class="dialog__stat">
      <div class="dialog__stat-label">WPM</div>
      <div class="dialog__stat-value">${calcWpm()}</div>
    </div>
    <div class="dialog__stat">
      <div class="dialog__stat-label">Accuracy</div>
      <div class="dialog__stat-value">${calcAccuracy()}%</div>
    </div>
  `;

  saveError.textContent = '';
  saveSuccess.hidden    = true;
  saveScoreBtn.hidden   = false;
  gameOverOverlay.hidden = false;
}

// ---- Save score ----
async function handleSaveScore() {
  const name = playerInput.value.trim();
  if (!name || name.length > 15) {
    saveError.textContent = 'Enter a name (max 15 characters).';
    return;
  }
  saveError.textContent = '';

  const scoreObj = {
    player:     name,
    pack:       packName,
    difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
    score:      state.score,
    level:      state.level,
    wpm:        calcWpm(),
    accuracy:   calcAccuracy(),
    date:       new Date().toISOString().slice(0, 10)
  };

  try {
    await addScore(scoreObj);
    saveScoreBtn.hidden   = true;
    saveSuccess.hidden    = false;
    saveSuccess.innerHTML = `Score saved! ✔ <a href="scores.html">View Leaderboard →</a>`;
  } catch (err) {
    saveError.textContent = 'Could not save score (storage may be restricted).';
    console.error(err);
  }
}

// ---- Play again ----
function handlePlayAgain() {
  gameOverOverlay.hidden = true;
  gameArea.hidden        = true;
  setupPanel.hidden      = false;
  populatePackSelect();
  prefillSetup();
}

// ---- Helpers ----
function resetState() {
  state.status     = 'idle';
  state.words      = [];
  state.score      = 0;
  state.level      = 1;
  state.lives      = 3;
  state.combo      = 1;
  state.destroyed  = 0;
  state.missed     = 0;
  state.wrong      = 0;
  state.letters    = 0;
  state.activeMs   = 0;
  state.spawnTimer = 0;
  updateStats();
  statLives.textContent = '❤️❤️❤️';
}

function clearWords() {
  state.words.forEach(w => w.el.remove());
  state.words = [];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
