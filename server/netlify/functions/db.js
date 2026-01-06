// db.js

const sqlite3 = require('sqlite3').verbose();

let db;

function openDb() {
  if (!db) {
    db = new sqlite3.Database('./data.db');
  }
  return db;
}

function getSetting(db, key, defaultValue) {
  const stmt = db.prepare("SELECT value FROM settings WHERE key=?");
  const result = stmt.get(key);
  return result ? result.value : defaultValue;
}

module.exports = { openDb, getSetting };
