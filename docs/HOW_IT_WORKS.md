# How WordBlast Works

A walkthrough of the application — how the pages connect, how data is stored, and how the game loop works.

---

## 1. The Big Picture

WordBlast has **three pages** that share the same stylesheet and a few helper scripts. There is no server — everything runs in the browser and all data is saved in the browser.

```
                      ┌───────────────────────────┐
                      │        Browser            │
                      │                           │
  index.html ──────►  │  game.js                  │
  (Play)              │     │  reads packs        │
                      │     ▼                     │
  packs.html ──────►  │  storage.js ◄── packs.js  │──► localStorage  (word packs)
  (Word Packs)        │                           │──► sessionStorage (last setup)
                      │  common.js ──────────────►│──► Cookies (theme, name)
  scores.html ─────►  │  db.js ◄── game.js        │
  (Leaderboard)       │     ▲      scores.js      │──► IndexedDB (scores)
                      └───────────────────────────┘
```

**Typical flow:**

1. **Word Packs page** — create or edit word lists.
2. **Play page** — pick a pack and difficulty, play the game.
3. **Game over** — save the score.
4. **Leaderboard** — view, rename, or delete scores.

---

## 2. Where Data Lives

| What | Where | Why |
|------|-------|-----|
| Word packs | `localStorage` | Small JSON, persists across sessions |
| Last chosen pack/difficulty | `sessionStorage` | Only needed until the tab closes |
| Theme (dark/light), last player name | Cookies | Small preferences that last a year |
| Scores | `IndexedDB` | Structured, queryable, handles many records |

All four can be inspected in Chrome via **DevTools → Application tab**.

### How a pack is saved

```js
// In memory
const packs = [{ id: 1, name: "Animals", words: ["tiger", "zebra"] }];

// Save
localStorage.setItem("wb_packs", JSON.stringify(packs));

// Load
const loaded = JSON.parse(localStorage.getItem("wb_packs")) || [];
```

### How a cookie is saved

```js
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
```

### How a score is saved in IndexedDB

IndexedDB works with requests that finish asynchronously, so the helpers wrap them in Promises and the rest of the code uses `async/await`.

```js
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("wordblastDB", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("scores", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addScore(score) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("scores", "readwrite");
    tx.objectStore("scores").add(score);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

---

## 3. Shared Parts (all pages)

**Navbar:** the same HTML block on each page. On narrow screens the links are hidden and a ☰ button toggles them open via a CSS class added or removed by `common.js`.

**Theme toggle:** colours are CSS variables. The `<html>` element carries either `data-theme="dark"` or `data-theme="light"`, and the CSS updates the variables for each. Clicking the 🌙 button flips the attribute and writes the choice to the `wb_theme` cookie. On every page load, `common.js` reads the cookie and applies the saved theme.

```css
:root               { --bg: #0b1020; --text: #e8ecff; }  /* dark default */
[data-theme="light"] { --bg: #f4f6fb; --text: #1b2040; }
body { background: var(--bg); color: var(--text); }
```

---

## 4. The Play Page

### 4.1 Starting a game

1. On load, `seedDefaultPacks()` ensures packs exist (first visit only).
2. The pack dropdown is filled from `getPacks()`; difficulty and name are pre-filled from `sessionStorage` and the player-name cookie.
3. Clicking **Start** reads the choices, resets game state, hides the setup panel, focuses the typing box and starts the loop.

### 4.2 Game state

```js
const state = {
  status: "idle",       // idle | running | paused | gameover
  words: [],            // falling words on screen
  pool: [],             // all words of the chosen pack (shuffled)
  score: 0, level: 1, lives: 3, combo: 1,
  destroyed: 0, missed: 0, wrong: 0, letters: 0,
  activeMs: 0,          // playing time, pause excluded
  spawnTimer: 0
};
```

Each falling word is an object linked to a DOM element:

```js
{ text: "tiger", x: 42, y: 0, el: <div class="word">tiger</div> }
// x = % from left, y = % from top
```

### 4.3 The game loop

`requestAnimationFrame` calls `gameLoop` roughly 60 times per second. Each call works out how much time has passed (`dt`) and updates everything by that amount, so the game runs at the same speed regardless of frame rate.

```js
function gameLoop(now) {
  if (state.status !== "running") return;
  const dt = (now - lastTime) / 1000;   // seconds since last frame
  lastTime = now;

  state.activeMs  += dt * 1000;
  state.spawnTimer += dt;

  if (state.spawnTimer >= spawnGap() && state.words.length < maxWords()) {
    spawnWord();
    state.spawnTimer = 0;
  }

  moveWords(dt);
  updateStats();
  requestAnimationFrame(gameLoop);
}
```

### 4.4 Spawning a word

1. Pick the next word from the shuffled pool (re-shuffle when exhausted).
2. Pick a random `x` between 5% and 80% so it stays inside the box.
3. Create a `<div class="word">`, set its text and `left` position, append it to the game area.
4. Push `{ text, x, y: 0, el }` into `state.words`.

### 4.5 Moving words

For every word: `word.y += speed * dt`, then `word.el.style.top = word.y + "%"`.  
If `word.y >= 97`, the word has reached the danger line — call `missWord(word)`.

### 4.6 Typing and matching

The typing box listens to the `input` event on every keystroke:

```js
typingInput.addEventListener("input", () => {
  const typed = typingInput.value.trim().toLowerCase();
  const matches = state.words.filter(w => w.text === typed);
  if (matches.length) {
    const target = matches.reduce((a, b) => (a.y > b.y ? a : b));
    destroyWord(target);
    typingInput.value = "";
  }
});
```

A `keydown` listener also handles **Enter**: if the text matches nothing, it counts as a wrong attempt (`wrong++`, combo resets, input clears).

### 4.7 Destroying a word

```
destroyWord(word):
  points = word.text.length * 10 + (combo - 1) * 5
  score += points
  combo = min(combo + 1, 10)
  destroyed++, letters += word.text.length
  play the "pop" animation, then remove the element after 200 ms
  remove the word from state.words
  if destroyed % 10 === 0 → levelUp()
```

### 4.8 Missing a word

```
missWord(word):
  lives--, missed++, combo = 1
  flash the word red and remove it
  update the hearts display
  if lives === 0 → endGame()
```

### 4.9 Level up

Every 10 destroyed words, `level++`. Speed and spawn gap are recalculated from the new level, so the game gradually gets harder. A brief "Level N!" banner appears at the top.

### 4.10 Pause, resume, restart and tab switch

- **Pause**: sets status to `"paused"`; the loop exits at the status check at the top.
- **Resume**: sets status back to `"running"`, resets `lastTime`, calls `requestAnimationFrame(gameLoop)`.
- **Restart**: clears all word elements and state, starts again.
- **Tab switch**: a `visibilitychange` listener auto-pauses when `document.hidden` is true, so lives are never lost while the player is looking at another tab.

### 4.11 Stats

- **WPM** = `(letters ÷ 5) ÷ (activeMs ÷ 60000)`
- **Accuracy** = `destroyed ÷ (destroyed + missed + wrong) × 100`

Both are recalculated in `updateStats()` on every frame and written to the stats bar.

### 4.12 Game over

`endGame()` sets status to `"gameover"`, removes remaining words and shows the dialog with the final numbers. The player can:

- **Save Score** — validates the name, saves the `wb_player` cookie, builds a score object and calls `addScore()` (IndexedDB), then shows "Saved ✔" with a link to the Leaderboard.
- **Play Again** — returns to the setup panel.

---

## 5. The Word Packs Page (CRUD)

One form is used for both creating and editing. A variable `editingId` tracks the mode: `null` = create, a number = edit that pack.

### Read

`renderPacks()` loads packs from localStorage and rebuilds the card grid. Each card shows the name, word count, word chips (first 8 + "+N more"), and **Edit** / **Delete** buttons.

### Create

1. User fills in the name and words, then presses **Save**.
2. `parseWords()` splits on newlines and commas, trims, lowercases, removes duplicates.
3. `validatePack()` checks name length, uniqueness, word format (2–15 letters) and count (5–100).
4. Errors appear inline; nothing is saved until all pass.
5. A new object `{ id: Date.now(), name, words }` is pushed to the array, saved to localStorage, and the grid re-renders.

### Update

Clicking **Edit** fills the form with the pack's data, sets `editingId`, changes the button to "Update Pack" and scrolls to the form. On save, the same validation runs (uniqueness check ignores the pack being edited). The existing object is updated in-place.

### Delete

Shows `confirm("Delete this pack?")`. Blocked if it's the last pack. Otherwise `filter()` creates a new array without that pack and saves it.

### Restore defaults

Overwrites `wb_packs` with the five built-in packs after a confirmation prompt.

---

## 6. The Leaderboard Page (CRUD on IndexedDB)

### Read

`renderScores(sortKey)` calls `getAllScores()` (async), sorts with `sort()` using the selected key (score, WPM, accuracy or date, highest/newest first), then builds a table row for each score. No scores → empty-state message.

### Create

Scores are created from the Play page, not from this page.

### Update

Clicking **Edit** prompts for a new player name (1–15 characters) and calls `updateScore(id, { player })`. Inside IndexedDB the helper reads the record, merges the change and writes it back with `put()`. The table re-renders.

### Delete

**Delete** (with confirmation) calls `deleteScore(id)`. **Clear All** (with confirmation) calls `clearScores()`. Both re-render the table.

---

## 7. Responsiveness

| Technique | Where |
|-----------|-------|
| `<meta name="viewport" content="width=device-width, initial-scale=1">` | Every page |
| Flexbox with `flex-wrap` | Navbar, stats bar, button rows |
| CSS Grid with `repeat(auto-fill, minmax(...))` | Pack cards: 1 → 2 → 3 columns |
| Media queries at 600px and 992px | Hamburger menu, column counts, game-area height |
| Relative units (`%`, `rem`, `vh`) | Word positions, font sizes, game area height |
| `overflow-x: auto` on the table wrapper | Leaderboard scrolls sideways on narrow screens |

Word positions and speeds are in **percent of the game area**, so the game plays identically on every screen size.

---

## 8. Error Handling

| Situation | What happens |
|-----------|-------------|
| localStorage is empty or corrupted | `JSON.parse` is in a `try/catch`; defaults are re-seeded automatically |
| IndexedDB cannot open (private mode) | An error message is shown; the game still plays but cannot save scores |
| No packs on the Play page | Default packs are re-seeded automatically |
| Same word appears twice on screen | The lowest instance is destroyed first |
| User switches tab | Game auto-pauses |
| Invalid or empty player name | Validation blocks saving and shows an inline message |

---

## 9. Glossary

| Term | Meaning |
|------|---------|
| CRUD | Create, Read, Update, Delete |
| DOM | The page structure that JavaScript can read and modify |
| `requestAnimationFrame` | Browser function that runs code before each screen repaint (~60 times per second) |
| `dt` (delta time) | Seconds since the last frame; makes movement speed independent of frame rate |
| JSON | Text format for storing objects and arrays |
| IndexedDB | A database built into the browser |
| Promise / `async` / `await` | Pattern for code that waits for async operations without blocking the page |
| Breakpoint | Screen width where the layout changes |
| WPM | Words per minute (measured as 5 letters per word) |