# 🔍 How WordBlast Works

A plain-language, step-by-step explanation of the whole application. Read this to understand the project, explain it to your professor, or plan your code.

---

## 1. The Big Picture

WordBlast has **three pages** that share the same stylesheet and a few helper scripts. There is **no server**: everything runs in the browser and all data is saved in the browser.

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

**The flow a user follows:**

1. **Word Packs page**: create or edit the lists of words they want to practice.
2. **Play page**: pick a pack and difficulty, play the game.
3. **Game over**: save the score.
4. **Leaderboard page**: see, rename, delete scores.

---

## 2. Where Data Lives

| What | Where | Why this choice |
|------|-------|-----------------|
| Word packs | `localStorage` | Small data, easy to store as JSON text |
| Last chosen pack/difficulty | `sessionStorage` | Only needed until the tab is closed |
| Theme (dark/light), last player name | Cookies | Small preferences that last a year |
| Scores | `IndexedDB` | A real database inside the browser, good for lists of records |

You can see all four in Chrome: **DevTools (F12) → Application tab**.

### Example: how a pack is saved

```js
// In memory: an array of objects
const packs = [{ id: 1, name: "Animals", words: ["tiger", "zebra"] }];

// Save: turn the array into text (JSON) and store it
localStorage.setItem("wb_packs", JSON.stringify(packs));

// Load: read the text and turn it back into an array
const loaded = JSON.parse(localStorage.getItem("wb_packs")) || [];
```

### Example: how a cookie is saved

```js
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
```

### Example: how a score is saved in IndexedDB

IndexedDB works with **requests** that finish later, so the helper wraps them in Promises and the rest of the code uses `async/await`.

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

**Navbar:** the same HTML block on each page. On narrow screens the links are hidden and a ☰ button toggles them open (a CSS class is added or removed by `common.js`).

**Theme toggle:** the colours are CSS variables. The page has either `data-theme="dark"` or `data-theme="light"` on `<html>`, and the CSS changes the variables for each. Clicking the 🌙 button flips the attribute and writes the choice to the `wb_theme` cookie. On every page load, `common.js` reads the cookie and applies the theme.

```css
:root              { --bg: #0b1020; --text: #e8ecff; }  /* dark default */
[data-theme="light"] { --bg: #f4f6fb; --text: #1b2040; }
body { background: var(--bg); color: var(--text); }
```

---

## 4. The Play Page (the game)

### 4.1 Start

1. On load, `seedDefaultPacks()` makes sure packs exist (first visit only).
2. The pack dropdown is filled from `getPacks()`; difficulty and name are pre-filled from `sessionStorage` and the cookie.
3. Clicking **Start** reads the choices, resets the game state, hides the setup panel, focuses the typing box and starts the loop.

### 4.2 Game state (one object)

```js
const state = {
  status: "idle",       // idle | running | paused | gameover
  words: [],            // falling words currently on screen
  pool: [],             // all words of the chosen pack
  score: 0, level: 1, lives: 3, combo: 1,
  destroyed: 0, missed: 0, wrong: 0, letters: 0,
  activeMs: 0,          // playing time (pause excluded)
  spawnTimer: 0
};
```

Each falling word is an object plus a DOM element:

```js
{ text: "tiger", x: 42, y: 0, el: <div class="word">tiger</div> }
// x = % from left, y = % from top
```

### 4.3 The game loop (the heart of the project)

`requestAnimationFrame` calls `gameLoop` about 60 times per second. Each call works out how much time passed (`dt`) and updates everything by that amount, so the game runs at the same speed on slow and fast devices.

```js
function gameLoop(now) {
  if (state.status !== "running") return;        // stop when paused or over
  const dt = (now - lastTime) / 1000;            // seconds since last frame
  lastTime = now;

  state.activeMs += dt * 1000;
  state.spawnTimer += dt;

  if (state.spawnTimer >= spawnGap() && state.words.length < maxWords()) {
    spawnWord();                                  // add a new word at the top
    state.spawnTimer = 0;
  }

  moveWords(dt);                                  // y += speed * dt for every word
  updateStats();                                  // refresh the stats bar
  requestAnimationFrame(gameLoop);                // schedule the next frame
}
```

### 4.4 Spawning a word

1. Pick a random word from `state.pool`.
2. Pick a random `x` between 5% and 80% so it stays inside the box.
3. Create a `<div class="word">`, set its text and `left` position, add it to the game area.
4. Push `{ text, x, y: 0, el }` into `state.words`.

### 4.5 Moving words

For every word: `word.y += speed * dt`, then `word.el.style.top = word.y + "%"`.
If `word.y >= 100`, the word reached the danger line, so call `missWord(word)`.

### 4.6 Typing and matching

The typing box listens to the `input` event, which fires on every keystroke:

```js
typingBox.addEventListener("input", () => {
  const typed = typingBox.value.trim().toLowerCase();
  // find all falling words that equal what was typed
  const matches = state.words.filter(w => w.text === typed);
  if (matches.length) {
    // if the same word is on screen twice, take the lowest one
    const target = matches.reduce((a, b) => (a.y > b.y ? a : b));
    destroyWord(target);
    typingBox.value = "";
  }
});
```

There is also a `keydown` listener: pressing **Enter** on text that matched nothing counts as a wrong attempt (`wrong++`, combo resets, box clears).

### 4.7 Destroying a word

```
destroyWord(word):
  points = word.text.length * 10 + (combo - 1) * 5
  score += points
  combo = min(combo + 1, 10)
  destroyed++, letters += word.text.length
  play the "pop" CSS animation, then remove the element after 200 ms
  remove the word from state.words
  if destroyed is a multiple of 10 → levelUp()
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

Every 10 destroyed words, `level++`. The speed and spawn gap are recalculated from the level (see formulas in the blueprint), so the game feels gradually harder. A small "Level 2!" banner appears briefly.

### 4.10 Pause, resume, restart, tab switch

- **Pause**: set status to `paused`; the loop stops because of the status check.
- **Resume**: set status back to `running`, reset `lastTime`, call `requestAnimationFrame(gameLoop)` again.
- **Restart**: clear all word elements and state, start again.
- **Tab switch**: a `visibilitychange` listener pauses the game automatically when `document.hidden` is true, so the player never loses lives while looking away.

### 4.11 Stats

- **WPM** = `(letters ÷ 5) ÷ (activeMs ÷ 60000)`
- **Accuracy** = `destroyed ÷ (destroyed + missed + wrong) × 100`
- Both are recalculated in `updateStats()` and written into the stats bar.

### 4.12 Game over

`endGame()` sets status to `gameover`, removes remaining words, and shows the dialog with the final numbers. The player can:

- **Save Score** → validates the name (1–15 characters), saves the cookie `wb_player`, builds the score object and calls `addScore()` (IndexedDB), then shows "Saved ✔" with a link to the Leaderboard.
- **Play Again** → returns to the setup panel.

---

## 5. The Word Packs Page (CRUD)

One form is used for both creating and editing. A variable `editingId` tells the code which mode it is in: `null` means create, a number means edit.

### 5.1 Read

`renderPacks()` loads packs from localStorage and rebuilds the card grid. For each pack it creates a card with the name, the number of words, small chips for the words, and **Edit** / **Delete** buttons.

### 5.2 Create

1. User fills the name and words (one per line or separated by commas), then presses **Save**.
2. `parseWords()` splits the text on newlines and commas, trims, lowercases, removes duplicates.
3. `validatePack()` checks every rule (name length, uniqueness, 2–15 letters, 5–100 words).
4. If there are errors, they are shown under the form and nothing is saved.
5. If valid, a new object `{ id: Date.now(), name, words }` is pushed into the array, `savePacks()` writes it to localStorage, the form clears and `renderPacks()` refreshes the grid.

### 5.3 Update

1. Clicking **Edit** on a card calls `editPack(id)`: it finds the pack with `find()`, fills the form with its data, sets `editingId = id`, changes the button text to "Update Pack" and scrolls to the form.
2. On Save, the same validation runs (the uniqueness check ignores the pack being edited).
3. The existing object is updated in place, saved, and the form returns to create mode.

### 5.4 Delete

1. Clicking **Delete** shows `confirm("Delete this pack?")`.
2. If it is the last pack, deletion is blocked with a message.
3. Otherwise `filter()` creates a new array without that pack, `savePacks()` stores it and the grid re-renders.

### 5.5 Restore defaults

Overwrites `wb_packs` with the three built-in packs after a confirmation. This is the safety net if the user deletes everything useful.

---

## 6. The Leaderboard Page (CRUD on IndexedDB)

### 6.1 Read
`renderScores(sortKey)` calls `getAllScores()` (async), sorts the array with `sort()` using the chosen key (score, WPM, accuracy or date, highest first), then builds a table row for each score with a rank number. If there are no scores, it shows an empty-state message.

### 6.2 Create
Scores are created from the Play page (section 4.12), not from this page.

### 6.3 Update
**Edit** asks for a new player name (validated 1–15 characters) and calls `updateScore(id, { player })`. Inside IndexedDB this reads the record, changes the field and writes it back with `put()`. The table is then re-rendered.

### 6.4 Delete
**Delete** (after confirmation) calls `deleteScore(id)`. **Clear All** (after confirmation) calls `clearScores()`. Both re-render the table.

---

## 7. How Responsiveness Works

| Technique | Where |
|-----------|-------|
| `<meta name="viewport" content="width=device-width, initial-scale=1">` | Every page, needed for mobile scaling |
| Flexbox with `flex-wrap` | Navbar, stats bar, button rows |
| CSS Grid with `repeat(auto-fill, minmax(...))` or breakpoints | Pack cards: 1 → 2 → 3 columns |
| Media queries at 600px and 992px | Hamburger menu, column counts, game-area height |
| Relative units (`%`, `rem`, `vw`/`vh`) | Falling positions in %, font sizes in rem, game area height in vh on mobile |
| Table wrapped in `overflow-x: auto` | Leaderboard scrolls sideways on narrow screens instead of breaking the layout |

Because word positions and speeds are in **percent** of the game area, the game plays the same way on every screen size.

---

## 8. Error Handling and Edge Cases

| Situation | What happens |
|-----------|-------------|
| localStorage is empty or corrupted | `JSON.parse` is wrapped in `try/catch`; defaults are re-seeded |
| IndexedDB cannot open (private mode) | A friendly message is shown; the game still plays but cannot save scores |
| User opens the Play page with no packs | Defaults are re-seeded automatically |
| Same word twice on screen | The lowest one is destroyed first |
| User switches tab or locks phone | Game auto-pauses |
| Very long or empty player name | Validation blocks saving and shows a message |

---

## 9. Typical User Journey (good for your demo)

1. Open the app → default packs are there. Toggle the theme.
2. Go to **Word Packs** → create "My Class Words", edit it, delete a test pack.
3. Go to **Play** → choose "My Class Words", Medium → play a round; lose a life on purpose.
4. Game over → enter a name → **Save Score**.
5. Go to **Leaderboard** → sort by WPM, rename the player, delete a score.
6. Refresh → everything is still there.
7. Open DevTools → **Application** and show localStorage, sessionStorage, Cookies and IndexedDB.
8. Resize the window or use device mode to show mobile, tablet and desktop layouts.

---

## 10. Quick Glossary

| Term | Meaning |
|------|---------|
| CRUD | Create, Read, Update, Delete |
| DOM | The page structure that JavaScript can change |
| `requestAnimationFrame` | Browser function that runs code before each screen repaint (about 60 times a second) |
| `dt` (delta time) | Seconds since the last frame; makes movement speed independent of frame rate |
| JSON | Text format for storing objects and arrays |
| IndexedDB | A database built into the browser |
| Promise / `async` / `await` | A way to write code that waits for something (like the database) without freezing the page |
| Breakpoint | Screen width where the layout changes |
| WPM | Words per minute (counted as 5 letters per word) |