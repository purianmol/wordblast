/* =====================================================
   db.js – IndexedDB helper for scores CRUD
   All functions return Promises so callers can use async/await.
   ===================================================== */

const DB_NAME    = 'wordblastDB';
const DB_VERSION = 1;
const STORE_NAME = 'scores';

/**
 * Opens (or creates) the wordblastDB database.
 * Creates the 'scores' object store on first run.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
        // Indexes for sorting
        store.createIndex('score',    'score',    { unique: false });
        store.createIndex('date',     'date',     { unique: false });
        store.createIndex('wpm',      'wpm',      { unique: false });
        store.createIndex('accuracy', 'accuracy', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Adds a new score record to IndexedDB.
 * @param {Object} score
 * @returns {Promise<void>}
 */
async function addScore(score) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(score);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/**
 * Returns all score records from IndexedDB.
 * @returns {Promise<Array>}
 */
async function getAllScores() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const req   = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Updates specific fields on an existing score record.
 * @param {number} id  – record id
 * @param {Object} changes – e.g. { player: 'NewName' }
 * @returns {Promise<void>}
 */
async function updateScore(id, changes) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = { ...getReq.result, ...changes };
      store.put(record);
    };

    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/**
 * Deletes a single score by id.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function deleteScore(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/**
 * Removes ALL score records from the store.
 * @returns {Promise<void>}
 */
async function clearScores() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}
