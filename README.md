# ⚡ WordBlast – Falling Words Typing Game

> A fast, responsive typing game where words fall from the sky and you must type them before they hit the ground. Create your own word packs and compete with your own high scores!

**Student Name:** _Your Name_
**Roll Number:** _Your Roll Number_
**Course:** Web Fundamentals 2026
**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (no external libraries)

---

## 1. Project Description

WordBlast is a frontend-only browser game that improves typing speed and accuracy. Words fall from the top of the screen, and the player types each word to destroy it before it reaches the bottom. Missing a word costs a life, and the game ends when all lives are lost. The speed increases with every level.

Players can build their own **word packs** (for example "JavaScript Terms", "Animals" or "Movies") using a full CRUD manager, and every game result is saved to a **leaderboard**. All data is stored in the browser, so no backend or login is needed.

## 2. Goals

- Build a fun, interactive game that demonstrates **CRUD operations** in a creative way.
- Use core **HTML, CSS and JavaScript** features covered in class, without any JS library.
- Provide a **responsive** design for mobile, tablet and desktop.
- Persist data using all three browser storage options: **Web Storage** (localStorage + sessionStorage), **Cookies** and **IndexedDB**.
- Keep the code clean, well-commented and easy to maintain.

## 3. Specifications

### 3.1 Pages

| Page | File | Purpose |
|------|------|---------|
| Play | `index.html` | Choose a word pack and difficulty, then play the game |
| Word Packs | `packs.html` | Create, view, edit and delete custom word packs |
| Leaderboard | `scores.html` | View, sort and delete saved scores |

### 3.2 CRUD Operations

| Operation | Word Packs | Scores |
|-----------|-----------|--------|
| **Create** | Add a new pack (name + list of words) via a form | A score is saved automatically when a game ends |
| **Read** | Pack cards list all packs and their words | Leaderboard table of all scores |
| **Update** | Edit pack name and words | Edit player name on a score |
| **Delete** | Delete a pack (with confirmation) | Delete one score or clear all |

### 3.3 Game Features

- Words fall at a speed based on difficulty (Easy / Medium / Hard)
- Type a word to destroy it: it is **matched automatically** as soon as the text equals a falling word (Enter clears a wrong attempt)
- **3 lives** (❤️): lose one when a word hits the ground
- **Score and combo** system: consecutive correct words give bonus points
- **Levels**: speed increases every 10 words
- Live stats: score, level, lives, WPM and accuracy
- Pause / Resume and Restart buttons
- Game-over screen with a summary and "Save Score" option
- Default built-in packs available on first visit
- Dark / neon theme toggle (preference saved in a cookie)
- Form validation (pack name 3–30 characters and unique, at least 5 valid words, duplicate words removed automatically)

### 3.4 Concepts Covered

| Area | Concepts used |
|------|---------------|
| **HTML** | Semantic tags (`header`, `nav`, `main`, `section`, `footer`), forms and input types, `select`, `textarea`, tables, buttons, meta viewport, accessibility attributes (`label`, `aria-*`) |
| **CSS** | Selectors, box model, Flexbox, Grid, CSS variables, `@keyframes` animations, transitions, hover/focus states, positioning, media queries |
| **JavaScript** | Variables, functions, arrays and objects, array methods (`map`, `filter`, `sort`, `find`, `reduce`), DOM manipulation, events, `setInterval` / `requestAnimationFrame`, validation, JSON, template literals, ES6 features |
| **Storage** | `localStorage` for word packs, **IndexedDB** for scores, `sessionStorage` for last selected pack/difficulty, **cookies** for theme and last player name |

### 3.5 Data Model

> Word packs live in `localStorage`; scores live in **IndexedDB** (the `id` is auto-generated).

```json
// Word pack
{
  "id": 1735000000000,
  "name": "JavaScript Terms",
  "words": ["array", "object", "function", "closure", "promise"]
}

// Score
{
  "id": 1735000100000,
  "player": "Rahul",
  "pack": "JavaScript Terms",
  "difficulty": "Medium",
  "score": 480,
  "wpm": 42,
  "accuracy": 94,
  "date": "2026-10-05"
}
```

## 4. Design

### 4.1 Game Screen Layout (wireframe)

```
+-----------------------------------------------+
| ⚡ WordBlast   Play | Word Packs | Scores  🌙 |
+-----------------------------------------------+
| Score: 120   Level: 2   Lives: ❤️❤️❤️   WPM: 38 |
+-----------------------------------------------+
|     function        array                      |
|                                  promise       |
|            object                              |
|                                                |
|  ~~~~~~~~~~~~~~ danger line ~~~~~~~~~~~~~~~~~  |
+-----------------------------------------------+
|  [ type here...                    ]  [Pause]  |
+-----------------------------------------------+
```

### 4.2 Responsive Behaviour

| Device | Width | Layout |
|--------|-------|--------|
| Mobile | < 600px | Full-width game area, hamburger menu, stacked stats |
| Tablet | 600–992px | Centered game area, stats in a row |
| Desktop | > 992px | Wide game area, full navigation bar |

### 4.3 Look and Feel

- Dark "storm" theme with neon blue / purple accents
- Glowing text for falling words, with a small explosion animation when a word is destroyed
- Card-based layout for word packs
- Clean monospace font for words

## 5. Folder Structure

```
wordblast/
├── index.html
├── packs.html
├── scores.html
├── css/
│   └── style.css
├── js/
│   ├── common.js      # navbar (hamburger), theme toggle, shared helpers
│   ├── storage.js     # localStorage, sessionStorage + cookie helpers
│   ├── db.js          # IndexedDB helper (scores CRUD)
│   ├── game.js        # game loop, scoring, lives
│   ├── packs.js       # word pack CRUD
│   └── scores.js      # leaderboard CRUD
├── docs/
│   ├── BLUEPRINT.md      # full project specification sheet
│   └── HOW_IT_WORKS.md   # detailed explanation of the working
└── README.md
```

## 6. Development Plan

| Day | Task |
|-----|------|
| 1 | Project setup, README, folder structure |
| 2 | HTML structure of all three pages |
| 3 | Base CSS: layout, navbar, theme |
| 4 | Responsive design with media queries |
| 5 | Game: falling words and movement |
| 6 | Game: typing detection, score, lives, game over |
| 7 | Word pack page: create and read (Create, Read) |
| 8 | Word pack page: edit and delete (Update, Delete) |
| 9 | IndexedDB scores + leaderboard page + theme cookie |
| 10 | Testing, bug fixes, polish, final README update |

## 7. More Documentation

- [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) – complete specification sheet, requirement checklist, test plan
- [`docs/HOW_IT_WORKS.md`](docs/HOW_IT_WORKS.md) – detailed explanation of how every part works

## 8. How to Run

1. Clone the repository: `git clone <repo-url>`
2. Open `index.html` in any modern browser.
3. No installation or server required.

## 9. Future Enhancements

- Sound effects for correct and missed words
- Power-ups (slow-motion, extra life)
- Daily challenge mode
- Export / import word packs as a JSON file

## 10. Author

**_Your Name_** – Roll No. _XXXXXXXXXX_