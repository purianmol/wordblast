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
      'giraffe', 'penguin', 'elephant', 'jaguar', 'falcon', 'buffalo', 'ostrich',
      'hamster', 'parrot', 'cougar', 'koala', 'panda', 'gorilla', 'pelican',
      'walrus', 'hyena', 'coyote', 'badger', 'lynx', 'iguana', 'gecko',
      'python', 'cobra', 'heron', 'toucan', 'beaver', 'otter', 'meerkat',
      'wombat', 'dingo', 'bison', 'moose', 'reindeer', 'alpaca', 'llama',
      'platypus', 'axolotl', 'lemur', 'manatee', 'narwhal'
    ]
  },
  {
    id: 2,
    name: 'JavaScript Terms',
    words: [
      'array', 'object', 'function', 'closure', 'promise', 'async', 'await',
      'callback', 'prototype', 'scope', 'hoisting', 'event', 'module', 'class',
      'iterator', 'generator', 'proxy', 'symbol', 'map', 'set', 'weakmap',
      'fetch', 'boolean', 'string', 'number', 'typeof', 'instanceof', 'spread',
      'destructure', 'arrow', 'template', 'const', 'let', 'var', 'export',
      'import', 'default', 'static', 'extends', 'getter', 'setter', 'reduce',
      'filter', 'forEach', 'includes', 'indexOf', 'splice', 'concat', 'slice'
    ]
  },
  {
    id: 3,
    name: 'Fruits and Food',
    words: [
      'mango', 'banana', 'orange', 'pizza', 'burger', 'grapes', 'papaya',
      'lychee', 'cherry', 'melon', 'waffle', 'salad', 'pasta', 'sushi', 'taco',
      'ramen', 'curry', 'falafel', 'hummus', 'burrito', 'donut', 'brownie',
      'cheesecake', 'tiramisu', 'muffin', 'pretzel', 'granola', 'smoothie',
      'avocado', 'broccoli', 'spinach', 'beetroot', 'zucchini', 'pumpkin',
      'pomelo', 'guava', 'jackfruit', 'tamarind', 'litchi', 'starfruit',
      'dragonfruit', 'persimmon', 'apricot', 'nectarine', 'tangerine', 'quince'
    ]
  },
  {
    id: 4,
    name: 'Countries',
    words: [
      'brazil', 'canada', 'france', 'germany', 'mexico', 'japan', 'china',
      'india', 'russia', 'italy', 'spain', 'turkey', 'egypt', 'kenya',
      'nigeria', 'ghana', 'peru', 'chile', 'colombia', 'argentina', 'sweden',
      'norway', 'denmark', 'finland', 'poland', 'ukraine', 'romania', 'hungary',
      'vietnam', 'thailand', 'malaysia', 'indonesia', 'pakistan', 'nepal',
      'bhutan', 'jordan', 'morocco', 'algeria', 'ethiopia', 'tanzania',
      'senegal', 'bolivia', 'ecuador', 'uruguay', 'paraguay', 'serbia',
      'croatia', 'slovakia', 'latvia', 'estonia'
    ]
  },
  {
    id: 5,
    name: 'Sports',
    words: [
      'cricket', 'tennis', 'hockey', 'boxing', 'cycling', 'rowing', 'skiing',
      'swimming', 'football', 'baseball', 'badminton', 'archery', 'fencing',
      'sailing', 'surfing', 'diving', 'climbing', 'triathlon', 'marathon',
      'sprinting', 'javelin', 'discus', 'hurdles', 'wrestling', 'judo',
      'karate', 'taekwondo', 'gymnastics', 'skating', 'snowboard', 'biathlon',
      'handball', 'lacrosse', 'polo', 'squash', 'racquetball', 'curling',
      'bobsled', 'luge', 'decathlon', 'pentathlon', 'weightlifting', 'shooting',
      'equestrian', 'kayaking', 'canoe', 'paragliding', 'motocross'
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
