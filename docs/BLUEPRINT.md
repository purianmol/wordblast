# 📐 WordBlast – Project Blueprint (Specification Sheet)

| | |
|---|---|
| **Project** | WordBlast – Falling Words Typing Game |
| **Course** | Web Fundamentals 2026 |
| **Type** | Frontend-only web application |
| **Stack** | HTML5 · CSS3 · Vanilla JavaScript (ES6) |
| **Storage** | localStorage · sessionStorage · Cookies · IndexedDB |
| **Pages** | 3 (Play, Word Packs, Leaderboard) |

---

## 1. Requirement Compliance Check

Every guideline from the project brief, mapped to how WordBlast satisfies it.

| # | Requirement (from brief) | How WordBlast meets it | Status |
|---|---|---|---|
| 1 | Frontend-only app | No server, no API calls, runs from `index.html` | ✅ |
| 2 | Tech stack: HTML, CSS, JS | Only these three languages are used | ✅ |
| 3 | No external libraries (except CSS) | No JS libraries or frameworks. CSS is hand-written (an optional Google Font is a CSS import) | ✅ |
| 4 | Include features covered in class | See the concept map in section 9. **Confirm against your class notes** | ⚠️ Verify |
| 5 | Responsive: mobile, tablet, desktop | 3 breakpoints, Flexbox/Grid, tested at 360px, 768px, 1280px | ✅ |
| 6 | At least 2 pages | 3 pages | ✅ |
| 7 | Storage: Web storage, cookie, IndexedDB | localStorage (packs), sessionStorage (last selection), cookies (theme, player name), IndexedDB (scores) | ✅ |
| 8 | CRUD operations | Full CRUD on Word Packs and on Scores | ✅ |
| 9 | GitHub repo, 10+ commits on different days | 10-day plan in section 12 (Oct 1–10) | ⚠️ Zero spare days |
| 10 | README.md in Markdown with proposal | README has description, goals, specifications, design | ✅ |
| 11 | Project details added to sheet | 3–4 line write-up ready (see section 13) | ⚠️ Overdue (30 Sep) |
| 12 | Proposal in README by 30 Sep | Ready, but the date has passed. Push it today | ⚠️ Overdue |
| 13 | Code complete by 10 Oct | 10-day plan ends on 10 Oct | ✅ |
| 14 | (Optional) Cloud deployment | GitHub Pages, free and takes about 2 minutes | ➕ Optional |

**Findings from verification (already fixed in README):**
1. The first draft used only localStorage and cookies. The brief lists IndexedDB too, so scores now use **IndexedDB**.
2. "Press Enter or auto-match" was ambiguous. The rule is now **auto-match**, and Enter only clears a wrong attempt.
3. Validation wording was vague. Exact rules are now in section 7.

---

## 2. Functional Requirements

| ID | Requirement | Page |
|----|-------------|------|
| F1 | Player selects a word pack and difficulty before starting | Play |
| F2 | Words fall from the top at random horizontal positions | Play |
| F3 | Typing a word that matches a falling word destroys it and awards points | Play |
| F4 | A word reaching the bottom costs one life (3 lives total) | Play |
| F5 | Level increases every 10 destroyed words, raising speed | Play |
| F6 | Pause, resume and restart controls | Play |
| F7 | Live stats: score, level, lives, WPM, accuracy | Play |
| F8 | Game-over dialog with summary and "Save Score" | Play |
| F9 | Create a new word pack | Word Packs |
| F10 | View all packs with their words | Word Packs |
| F11 | Edit an existing pack | Word Packs |
| F12 | Delete a pack (with confirmation) | Word Packs |
| F13 | Restore the default packs | Word Packs |
| F14 | Save a score to IndexedDB (Create) | Play → Leaderboard |
| F15 | View scores in a sortable table (Read) | Leaderboard |
| F16 | Edit the player name on a score (Update) | Leaderboard |
| F17 | Delete one score, or clear all (Delete) | Leaderboard |
| F18 | Dark / light theme toggle, remembered by cookie | All |
| F19 | Responsive navbar with hamburger menu on mobile | All |

## 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| N1 | Works offline once files are loaded (no network calls) |
| N2 | Works in the latest Chrome, Edge, Firefox |
| N3 | Game runs at a smooth speed (uses `requestAnimationFrame`) |
| N4 | Touch-friendly: buttons at least 44px tall, input auto-focused on Start |
| N5 | Accessible basics: labels on inputs, `alt`/`aria-label`, visible focus outline, good colour contrast |
| N6 | Clean, commented code with a separate JS file per feature |

---

## 4. Page Specifications

### 4.1 Play – `index.html`

| Section | Elements |
|---------|----------|
| Navbar | Logo, links (Play, Word Packs, Scores), theme button, hamburger (mobile) |
| Setup panel | Pack `<select>`, difficulty `<select>`, player name `<input>`, **Start** button |
| Stats bar | Score, Level, Lives (❤️), WPM, Accuracy |
| Game area | Bordered box with falling words and a red "danger line" at the bottom |
| Controls | Typing `<input>`, **Pause/Resume**, **Restart** |
| Game-over dialog | Final score, level, WPM, accuracy, **Save Score**, **Play Again** |
| Footer | Name, course, year |

**States:** `idle` → `running` ⇄ `paused` → `gameover`

### 4.2 Word Packs – `packs.html`

| Section | Elements |
|---------|----------|
| Form (Create / Edit) | Pack name `<input>`, words `<textarea>` (one per line or comma-separated), **Save**, **Cancel** |
| Error area | Inline validation messages |
| Pack list | Card grid. Each card has name, word count, word chips, **Edit** and **Delete** buttons |
| Extra | **Restore Default Packs** button |

### 4.3 Leaderboard – `scores.html`

| Section | Elements |
|---------|----------|
| Controls | Sort `<select>` (Score, WPM, Accuracy, Date), **Clear All** |
| Table | Rank, Player, Pack, Difficulty, Score, WPM, Accuracy, Date, Actions (**Edit**, **Delete**) |
| Empty state | "No scores yet – go play!" with a link to Play |
| Edit | Inline edit of the player name (prompt or inline input) |

---

## 5. Data Design

### 5.1 Storage Map

| Data | Storage | Key / Name | Why |
|------|---------|-----------|-----|
| Word packs (array) | `localStorage` | `wb_packs` | Small, simple JSON |
| Seeded flag | `localStorage` | `wb_seeded` | Seed defaults only on first visit |
| Last pack + difficulty | `sessionStorage` | `wb_lastSetup` | Pre-fill the setup panel for this browser session only |
| Theme | Cookie | `wb_theme` (`dark` / `light`) | Preference, 365 days |
| Last player name | Cookie | `wb_player` | Pre-fill name, 365 days |
| Scores | `IndexedDB` | DB `wordblastDB` v1, store `scores` | Larger, structured, queryable data |

### 5.2 Word Pack object (`wb_packs` = array of these)

| Field | Type | Rule |
|-------|------|------|
| `id` | number | `Date.now()` at creation |
| `name` | string | 3–30 characters, unique (case-insensitive) |
| `words` | string[] | lowercase letters only, 2–15 characters each, 5–100 words, no duplicates |

### 5.3 Score object (IndexedDB store `scores`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | keyPath, `autoIncrement` |
| `player` | string | 1–15 characters |
| `pack` | string | Pack name at play time |
| `difficulty` | string | Easy / Medium / Hard |
| `score` | number | Final score |
| `level` | number | Level reached |
| `wpm` | number | Rounded |
| `accuracy` | number | 0–100, rounded |
| `date` | string | ISO date, e.g. `2026-10-05` |

Indexes: `score`, `date`.

### 5.4 Default Packs (seeded on first visit)

| Pack | Example words (15+ each) |
|------|--------------------------|
| Animals | tiger, zebra, monkey, rabbit, dolphin … |
| JavaScript Terms | array, object, function, closure, promise … |
| Fruits and Food | mango, banana, orange, pizza, burger … |

---

## 6. Game Rules and Formulas

### 6.1 Difficulty settings

Speed is measured in **% of game-area height per second**, so it behaves the same on every screen size.

| Difficulty | Fall speed | Spawn gap | Max words on screen |
|-----------|-----------|-----------|--------------------|
| Easy | 9 %/s (about 11 s to fall) | 2.5 s | 4 |
| Medium | 13 %/s (about 7.7 s) | 2.0 s | 6 |
| Hard | 19 %/s (about 5.3 s) | 1.5 s | 8 |

### 6.2 Level progression

- `level = 1 + floor(wordsDestroyed / 10)`
- `speed = baseSpeed × (1 + 0.15 × (level − 1))`
- `spawnGap = max(0.8 s, baseGap − 0.15 s × (level − 1))`

### 6.3 Scoring

- `points = wordLength × 10 + (combo − 1) × 5`
- `combo` increases by 1 for each destroyed word (capped at 10) and resets to 1 when a word is missed or a wrong attempt is made.
- Example: destroying "tiger" (5 letters) on combo 3 → 50 + 10 = **60 points**.

### 6.4 Lives

- Start with 3 lives. A word touching the danger line is removed and `lives −= 1`.
- Game over when `lives == 0`.

### 6.5 Stats

| Stat | Formula |
|------|---------|
| WPM | `(total letters in destroyed words ÷ 5) ÷ activeMinutes` (pause time excluded; shows 0 for the first 5 seconds) |
| Accuracy | `destroyed ÷ (destroyed + missed + wrongAttempts) × 100`; 100 if nothing has happened yet |

### 6.6 Typing rules

- Matching is **case-insensitive** and trims spaces.
- As soon as the input text equals a falling word, that word is destroyed and the input clears. If two identical words are on screen, the **lowest** one is destroyed.
- **Enter** with text that matches nothing counts as a wrong attempt, clears the input and resets combo.

---

## 7. Validation Rules

| Field | Rule | Error message |
|-------|------|--------------|
| Pack name | Required, 3–30 characters | "Pack name must be 3–30 characters." |
| Pack name | Unique (case-insensitive) | "A pack with this name already exists." |
| Words | Each word 2–15 letters, a–z only | "Words can only contain letters (2–15)." |
| Words | At least 5 valid words, at most 100 | "Add at least 5 words." |
| Words | Duplicates | Removed automatically, with an info note |
| Player name | 1–15 characters | "Enter a name (max 15 characters)." |
| Delete pack | Cannot delete the last remaining pack | "Keep at least one pack to play." |

---

## 8. Code Blueprint

### 8.1 Files and responsibilities

| File | Responsibility |
|------|---------------|
| `js/common.js` | Hamburger menu toggle, theme apply/toggle, footer year |
| `js/storage.js` | `localStorage` pack helpers, `sessionStorage` helpers, cookie helpers |
| `js/db.js` | IndexedDB open + scores CRUD (Promise based) |
| `js/game.js` | Game state, loop, spawning, input matching, scoring, game over |
| `js/packs.js` | Word Packs page: form, validation, render, edit, delete |
| `js/scores.js` | Leaderboard page: render, sort, edit, delete, clear |
| `css/style.css` | All styles: variables, layout, components, animations, media queries |

### 8.2 Function list

**storage.js**
`getPacks()` · `savePacks(packs)` · `seedDefaultPacks()` · `resetDefaultPacks()` · `setCookie(name, value, days)` · `getCookie(name)` · `saveSetup(obj)` · `loadSetup()`

**db.js**
`openDB()` · `addScore(score)` · `getAllScores()` · `updateScore(id, changes)` · `deleteScore(id)` · `clearScores()`

**game.js**
`startGame()` · `gameLoop(timestamp)` · `spawnWord()` · `moveWords(dt)` · `handleInput(e)` · `destroyWord(word)` · `missWord(word)` · `updateStats()` · `levelUp()` · `pauseGame()` / `resumeGame()` · `endGame()` · `saveCurrentScore()`

**packs.js**
`renderPacks()` · `handleSave(e)` · `validatePack(name, rawWords, editingId)` · `parseWords(raw)` · `editPack(id)` · `deletePack(id)` · `resetForm()`

**scores.js**
`renderScores(sortKey)` · `editPlayer(id)` · `removeScore(id)` · `clearAll()`

**common.js**
`applyTheme(theme)` · `toggleTheme()` · `initNav()`

### 8.3 Module dependencies

```
common.js  ──► storage.js (cookies)
game.js    ──► storage.js (packs, session) + db.js (save score)
packs.js   ──► storage.js (packs)
scores.js  ──► db.js
```

Script load order on each page: `storage.js` → `db.js` (if needed) → `common.js` → page script.

---

## 9. Class Concept Map (where each topic is used)

| Topic | Where it is used |
|-------|------------------|
| Semantic HTML | `header`, `nav`, `main`, `section`, `footer` on every page |
| Forms and inputs | Pack form, setup panel, typing input |
| Tables | Leaderboard |
| Selectors, box model | Whole stylesheet |
| Flexbox | Navbar, stats bar, controls |
| Grid | Pack card grid |
| CSS variables | Colours and theme switching |
| Transitions / animations | Word glow, explosion effect, button hovers, dialog fade |
| Media queries | 3 breakpoints |
| Variables, functions, ES6 | All JS |
| Arrays and objects | Packs, scores, active words |
| Array methods | `map`, `filter`, `sort`, `find`, `reduce`, `some` |
| DOM creation/manipulation | Falling words, cards, table rows |
| Events | `click`, `input`, `keydown`, `submit`, `visibilitychange` |
| Timers / animation | `requestAnimationFrame`, `setTimeout` |
| JSON | Packs in localStorage |
| Web Storage | localStorage + sessionStorage |
| Cookies | Theme and player name |
| IndexedDB | Scores |
| Validation | Pack form, player name |

> ⚠️ **Action for you:** compare this table with your class notes. If a topic taught in class is missing (e.g. `fetch`, Promises/async-await, classes, destructuring, Web Workers), add a small use of it. Promises/async-await are already needed for IndexedDB.

---

## 10. UI Design Spec

### 10.1 Colour tokens (CSS variables)

| Token | Dark (default) | Light |
|-------|---------------|-------|
| `--bg` | `#0b1020` | `#f4f6fb` |
| `--surface` | `#151b34` | `#ffffff` |
| `--text` | `#e8ecff` | `#1b2040` |
| `--primary` | `#6c7bff` | `#4a56e2` |
| `--accent` | `#22d3ee` | `#0891b2` |
| `--danger` | `#ff5c7a` | `#e11d48` |
| `--success` | `#34d399` | `#059669` |

### 10.2 Typography
- Headings and UI: system sans-serif stack
- Falling words and input: monospace (`"Courier New", monospace`)
- Base size 16px; falling words 1.1–1.4rem

### 10.3 Breakpoints

| Name | Width | Changes |
|------|-------|---------|
| Mobile | `< 600px` | Hamburger menu, stats wrap into 2 rows, 1-column packs, game area height about 55vh |
| Tablet | `600–992px` | 2-column packs, stats in one row |
| Desktop | `> 992px` | Full navbar, 3-column packs, game area up to 900px wide |

### 10.4 Animations
- Words: soft neon `text-shadow` glow
- Destroyed word: scale up and fade out (200 ms)
- Missed word: flash red, then removed
- Lives: heart pulse when one is lost
- Dialog: fade in

---

## 11. Test Plan

| # | Test | Expected result |
|---|------|----------------|
| T1 | Open the app for the first time | 3 default packs exist |
| T2 | Start game, type a falling word | Word disappears, score increases |
| T3 | Let a word reach the bottom | Life decreases by 1 |
| T4 | Lose all 3 lives | Game-over dialog appears |
| T5 | Click Pause | Words stop moving; Resume continues |
| T6 | Switch to another browser tab | Game auto-pauses |
| T7 | Save score, open Leaderboard | Score appears in the table |
| T8 | Refresh the page | Packs, scores and theme still there |
| T9 | Create pack with 3 words | Validation error shown |
| T10 | Create pack with duplicate name | Validation error shown |
| T11 | Edit a pack, then play with it | Changes are used in the game |
| T12 | Delete a pack | Confirmation, then card disappears |
| T13 | Delete the last pack | Blocked with message |
| T14 | Edit player name on a score | Table updates and survives refresh |
| T15 | Delete one score / Clear all | Rows removed from IndexedDB |
| T16 | Toggle theme and reload | Theme persists (cookie) |
| T17 | Resize to 360px / 768px / 1280px | Layout adapts, no horizontal scroll |
| T18 | Play on a phone | Keyboard opens, input is usable |
| T19 | Open browser DevTools → Application | localStorage, sessionStorage, cookies and IndexedDB all show data |

---

## 12. Git and Delivery Plan

Rule: **one commit per day, 10 different days**. The window Oct 1–10 has exactly 10 days, so you cannot skip any day. Make more than one commit per day if you like, but never rely on a "catch-up" day.

| Date | Commit focus | Example message |
|------|-------------|-----------------|
| Oct 1 | Repo, README, folder structure | `Initial commit: add README and project structure` |
| Oct 2 | HTML for all 3 pages | `Add HTML structure for play, packs and scores pages` |
| Oct 3 | Base CSS, navbar, theme variables | `Add base styles, navbar and dark/light theme` |
| Oct 4 | Responsive CSS and media queries | `Make layout responsive for mobile, tablet, desktop` |
| Oct 5 | Falling words + movement | `Add word spawning and falling animation` |
| Oct 6 | Typing detection, score, lives, game over | `Implement typing match, scoring and lives` |
| Oct 7 | Packs: create + read, storage.js | `Add word pack create and display with localStorage` |
| Oct 8 | Packs: edit + delete + validation | `Add edit, delete and validation for packs` |
| Oct 9 | IndexedDB scores + leaderboard + cookie theme | `Add IndexedDB scores, leaderboard and theme cookie` |
| Oct 10 | Testing, polish, final README | `Final testing, bug fixes and README update` |

**Optional deployment:** Repo → Settings → Pages → Deploy from branch `main` / root. Add the live link to the README.

---

## 13. Sheet Entry (copy-paste)

**Project Name:** WordBlast

**Project Details (3–4 lines):**
> WordBlast is a responsive typing game where words fall down the screen and players must type them before they reach the bottom. Players can create, edit and delete their own custom word packs, choose a difficulty level, and track scores, accuracy and typing speed (WPM) on a leaderboard. Built with HTML, CSS and vanilla JavaScript, with data stored in the browser using localStorage, sessionStorage, cookies and IndexedDB.

**GitHub repository path:** `https://github.com/<your-username>/wordblast`

---

## 14. Assumptions and Risks

| Item | Note |
|------|------|
| Class syllabus | Not visible to the author. Check section 9 against your notes |
| Mobile typing | On-screen keyboards cover part of the screen; the game area height is reduced on mobile to compensate |
| Private browsing | IndexedDB or storage may be restricted; the app shows a friendly message if opening the DB fails |
| Scope | If time runs short, drop: restore-defaults button, edit-score feature, light theme. Core = play + pack CRUD + save/delete scores |