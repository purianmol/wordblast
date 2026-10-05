/* =====================================================
   storage.js – localStorage, sessionStorage & cookie helpers
   ===================================================== */

const PACKS_KEY  = 'wb_packs';
const SEEDED_KEY = 'wb_seeded';
const SETUP_KEY  = 'wb_lastSetup';

// ---- Default word packs ----
const DEFAULT_PACKS = [
  {
    id: 1,
    name: 'Animals',
    words: [
      'tiger', 'zebra', 'monkey', 'rabbit', 'dolphin', 'panther', 'cheetah',
      'giraffe', 'penguin', 'elephant', 'jaguar', 'falcon', 'buffalo', 'ostrich', 'hamster'
    ]
  },
  {
    id: 2,
    name: 'JavaScript Terms',
    words: [
      'array', 'object', 'function', 'closure', 'promise', 'async', 'await',
      'callback', 'prototype', 'scope', 'hoisting', 'event', 'module', 'class', 'iterator'
    ]
  },
  {
    id: 3,
    name: 'Fruits and Food',
    words: [
      'mango', 'banana', 'orange', 'pizza', 'burger', 'grapes', 'papaya',
      'lychee', 'cherry', 'melon', 'waffle', 'salad', 'pasta', 'sushi', 'taco'
    ]
  }
];

// ---- Pack helpers (localStorage) ----

/**
 * Returns the array of packs from localStorage, or an empty array.
 */
function getPacks() {
  try {
    return JSON.parse(localStorage.getItem(PACKS_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Saves the packs array to localStorage.
 * @param {Array} packs
 */
function savePacks(packs) {
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs));
}

/**
 * Seeds the default packs on the very first visit only.
 */
function seedDefaultPacks() {
  if (!localStorage.getItem(SEEDED_KEY)) {
    savePacks(DEFAULT_PACKS);
    localStorage.setItem(SEEDED_KEY, '1');
  }
}

/**
 * Overwrites packs with the three built-in defaults.
 */
function resetDefaultPacks() {
  savePacks(DEFAULT_PACKS);
}

// ---- Session helpers (sessionStorage) ----

/**
 * Saves the last-used pack + difficulty for this session.
 * @param {{ packId: number, difficulty: string }} obj
 */
function saveSetup(obj) {
  sessionStorage.setItem(SETUP_KEY, JSON.stringify(obj));
}

/**
 * Loads the last-used pack + difficulty for this session.
 * @returns {{ packId: number, difficulty: string } | null}
 */
function loadSetup() {
  try {
    return JSON.parse(sessionStorage.getItem(SETUP_KEY)) || null;
  } catch {
    return null;
  }
}

// ---- Cookie helpers ----

/**
 * Sets a cookie.
 * @param {string} name
 * @param {string} value
 * @param {number} days
 */
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

/**
 * Gets a cookie value by name, or null if not found.
 * @param {string} name
 * @returns {string|null}
 */
function getCookie(name) {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}
