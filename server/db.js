import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

// Open the database and handle errors
let db;

export function openDb() {
  if (!db) {
    try {
      db = new Database("./data.db");
      db.pragma("journal_mode = WAL");
    } catch (error) {
      console.error("Error opening database:", error.message);
      throw new Error("Failed to open the database");
    }
  }
  return db;
}

// Retrieve a setting from the settings table with error handling
export function getSetting(db, key, fallback = null) {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key=?").get(key);
    return row ? row.value : fallback;
  } catch (error) {
    console.error(`Error fetching setting for key ${key}:`, error.message);
    return fallback;
  }
}

// Insert or update a setting in the settings table with error handling
export function setSetting(db, key, value) {
  try {
    db.prepare("INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, String(value));
  } catch (error) {
    console.error(`Error setting value for ${key}:`, error.message);
  }
}

// Seed default settings if they do not exist
export function seedSetting(db, key, value) {
  const exists = db.prepare("SELECT key FROM settings WHERE key=?").get(key);
  if (!exists) {
    try {
      db.prepare("INSERT INTO settings(key, value) VALUES(?, ?)").run(key, value);
    } catch (error) {
      console.error(`Error seeding setting for key ${key}:`, error.message);
    }
  }
}

// Seed admin user with hashed password if it doesn't exist
export function seedAdmin(db) {
  // Fetch the admin username and password from environment variables
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error("Admin username or password not set in environment variables.");
    return;
  }

  // Check if the admin user already exists
  const row = db.prepare("SELECT id FROM admin_users WHERE username=?").get(adminUsername);
  if (row) {
    console.log("Admin user already exists.");
    return;
  }

  // Hash the password and insert the new admin user
  const hash = bcrypt.hashSync(adminPassword, 10);
  try {
    db.prepare("INSERT INTO admin_users(username, password_hash, role, created_at) VALUES(?, ?, ?, ?)")
      .run(adminUsername, hash, "admin", Date.now());
    console.log("Admin user created successfully.");
  } catch (error) {
    console.error("Error seeding admin user:", error.message);
  }
}

// Log admin actions for auditing purposes
export function audit(db, adminId, action, targetType = null, targetId = null, meta = null) {
  try {
    const metaJson = meta ? JSON.stringify(meta) : null;
    db.prepare("INSERT INTO audit_logs(admin_id, action, target_type, target_id, meta_json, created_at) VALUES(?, ?, ?, ?, ?, ?)")
      .run(adminId, action, targetType, targetId, metaJson, Date.now());
  } catch (error) {
    console.error("Error logging audit action:", error.message);
  }
}

// Function to create tables if they don't exist
export function initializeDatabase() {
  const db = openDb();
  
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT UNIQUE NOT NULL,
        first_name TEXT,
        username TEXT,
        balance_available INTEGER NOT NULL DEFAULT 0,
        balance_pending INTEGER NOT NULL DEFAULT 0,
        total_earned INTEGER NOT NULL DEFAULT 0,
        ads_today INTEGER NOT NULL DEFAULT 0,
        ads_today_date TEXT,
        last_ad_at INTEGER,
        is_frozen INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS earn_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        provider_event_id TEXT UNIQUE,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        method TEXT NOT NULL,
        address TEXT NOT NULL,
        status TEXT NOT NULL,
        admin_note TEXT,
        reject_reason TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        meta_json TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(admin_id) REFERENCES admin_users(id)
      );
    `);

    // Seed default settings
    seedSetting(db, "reward_per_ad", "10");
    seedSetting(db, "min_withdraw", "1000");
    seedSetting(db, "ad_cooldown_seconds", "30");
    seedSetting(db, "daily_ad_cap", "200");  // Adjust this as needed
    seedSetting(db, "one_withdrawal_at_a_time", "true");
    seedSetting(db, "processing_time", "24–72h");
  } catch (error) {
    console.error("Error initializing the database:", error.message);
  }
}
