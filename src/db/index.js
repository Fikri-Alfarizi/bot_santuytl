import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'santuy.db');
const db = new Database(dbPath/*, { verbose: console.log }*/);

// Initialize tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        coins INTEGER DEFAULT 0,
        last_daily INTEGER DEFAULT 0,
        last_weekly INTEGER DEFAULT 0,
        is_afk INTEGER DEFAULT 0,
        afk_reason TEXT DEFAULT NULL,
        afk_timestamp INTEGER DEFAULT 0,
        job TEXT DEFAULT 'Pengangguran',
        daily_spins INTEGER DEFAULT 0,
        last_spin_time INTEGER DEFAULT 0
    )
`);

// Migration for Job & Spin (Safe Try-Catch)
try {
    db.exec("ALTER TABLE users ADD COLUMN job TEXT DEFAULT 'Pengangguran'");
    db.exec("ALTER TABLE users ADD COLUMN daily_spins INTEGER DEFAULT 0");
    db.exec("ALTER TABLE users ADD COLUMN last_spin_time INTEGER DEFAULT 0");
} catch (e) { /* Column exists */ }

// Initialize Guild Settings Table (Updated)
db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        welcome_channel_id TEXT,
        leave_channel_id TEXT,
        log_channel_id TEXT,
        game_source_channel_id TEXT,
        request_channel_id TEXT,
        news_channel_id TEXT,
        welcome_message TEXT DEFAULT 'Selamat datang {user} di {server}!',
        auto_role_id TEXT
    )
`);

try {
    db.exec("ALTER TABLE guild_settings ADD COLUMN game_source_channel_id TEXT");
    db.exec("ALTER TABLE guild_settings ADD COLUMN request_channel_id TEXT");
    db.exec("ALTER TABLE guild_settings ADD COLUMN news_channel_id TEXT");
} catch (e) { /* Column exists */ }

// News History to prevent duplicates
db.exec(`
    CREATE TABLE IF NOT EXISTS news_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        news_guid TEXT UNIQUE,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
`);

export default db;
