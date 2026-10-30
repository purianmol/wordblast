# ⚡ WordBlast – Falling Words Typing Game

A browser-based typing game where words fall from the top of the screen and you have to type them before they hit the ground. Built as a frontend project for Web Fundamentals.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (no libraries)

---

## What it does

Words fall down the game area one by one. You type each word to destroy it. Miss too many and you lose a life — lose all three and it's game over. The game gets faster as you level up.

You can build your own **word packs** (like "JavaScript Terms", "Animals", or anything else) using a built-in editor, and every game result is saved to a **leaderboard**. Everything is stored in the browser — no server, no login needed.

## Pages

| Page | File | What it does |
|------|------|-------------|
| Play | `index.html` | Pick a pack, pick difficulty, play |
| Word Packs | `packs.html` | Create, edit and delete word packs |
| Leaderboard | `scores.html` | View and manage saved scores |

## Features

- Words fall at a speed based on difficulty (Easy / Medium / Hard)
- Auto-match: the moment you finish typing a word it disappears — no Enter needed
- 3 lives ❤️ — lose one when a word hits the bottom
- Combo multiplier for consecutive correct words
- Speed and spawn rate increase every 10 words (level up)
- Live stats: score, level, lives, WPM and accuracy
- Pause / Resume and Restart
- Game over screen with a score summary and Save option
- 5 built-in word packs, each with 40+ words
- Dark / light theme toggle (saved as a cookie)
- Full word pack CRUD with validation
- Sortable leaderboard with edit and delete

## Storage

| Data | Where |
|------|-------|
| Word packs | `localStorage` |
| Last pack / difficulty selected | `sessionStorage` |
| Theme preference, last player name | Cookies |
| Scores | IndexedDB |

## Folder structure

```
wordblast/
├── index.html
├── packs.html
├── scores.html
├── css/
│   └── style.css
├── js/
│   ├── common.js      # navbar, theme toggle
│   ├── storage.js     # localStorage, sessionStorage, cookies, default packs
│   ├── db.js          # IndexedDB scores CRUD
│   ├── game.js        # game loop, scoring, lives
│   ├── packs.js       # word pack CRUD page
│   └── scores.js      # leaderboard page
└── docs/
    ├── BLUEPRINT.md
    └── HOW_IT_WORKS.md
```