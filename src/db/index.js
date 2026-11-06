import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'santuy.db');
const rawDb = new DatabaseSync(dbPath);

// Lightweight wrapper to maintain complete 100% compatibility with better-sqlite3 API
class DatabaseWrapper {
    constructor(db) {
        this.db = db;
    }

    exec(sql) {
        return this.db.exec(sql);
    }

    prepare(sql) {
        const stmt = this.db.prepare(sql);
        return {
            run: (...args) => {
                const params = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
                const result = stmt.run(...params);
                return {
                    changes: result.changes,
                    lastInsertRowid: result.lastInsertRowid
                };
            },
            get: (...args) => {
                const params = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
                return stmt.get(...params);
            },
            all: (...args) => {
                const params = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
                return stmt.all(...params);
            }
        };
    }
}

const db = new DatabaseWrapper(rawDb);

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
        last_spin_time INTEGER DEFAULT 0,
        seasonal_xp INTEGER DEFAULT 0
    )
`);

// Migration for Job & Spin (Each column in its own try-catch to prevent skipping)
try { db.exec("ALTER TABLE users ADD COLUMN job TEXT DEFAULT 'Pengangguran'"); } catch (e) { /* Column exists */ }
try { db.exec("ALTER TABLE users ADD COLUMN daily_spins INTEGER DEFAULT 0"); } catch (e) { /* Column exists */ }
try { db.exec("ALTER TABLE users ADD COLUMN last_spin_time INTEGER DEFAULT 0"); } catch (e) { /* Column exists */ }
try { db.exec("ALTER TABLE users ADD COLUMN seasonal_xp INTEGER DEFAULT 0"); } catch (e) { /* Column exists */ }

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
        general_chat_channel_id TEXT,
        welcome_message TEXT DEFAULT 'Selamat datang {user} di {server}!',
        auto_role_id TEXT
    )
`);

// Add missing columns individually with better error handling
const columnsToAdd = [
    { name: 'game_source_channel_id', sql: "ALTER TABLE guild_settings ADD COLUMN game_source_channel_id TEXT" },
    { name: 'request_channel_id', sql: "ALTER TABLE guild_settings ADD COLUMN request_channel_id TEXT" },
    { name: 'news_channel_id', sql: "ALTER TABLE guild_settings ADD COLUMN news_channel_id TEXT" },
    { name: 'general_chat_channel_id', sql: "ALTER TABLE guild_settings ADD COLUMN general_chat_channel_id TEXT" },
    { name: 'alarm_channel_id', sql: "ALTER TABLE guild_settings ADD COLUMN alarm_channel_id TEXT" },
    { name: 'alarm_schedule', sql: "ALTER TABLE guild_settings ADD COLUMN alarm_schedule TEXT DEFAULT '07:00'" },
    { name: 'levelup_channel_id', sql: "ALTER TABLE guild_settings ADD COLUMN levelup_channel_id TEXT" },
    { name: 'admin_allowed_roles', sql: "ALTER TABLE guild_settings ADD COLUMN admin_allowed_roles TEXT DEFAULT NULL" }
];

columnsToAdd.forEach(({ name, sql }) => {
    try {
        db.exec(sql);
        console.log(`✅ Migration: Added column '${name}' to guild_settings`);
    } catch (e) {
        if (e.message && (e.message.includes('duplicate column name') || e.message.includes('already exists'))) {
            // Column already exists, this is okay
        } else {
            console.error(`❌ Migration error for column '${name}':`, e.message);
        }
    }
});

// Games Cache Table for /game autocomplete search
db.exec(`
    CREATE TABLE IF NOT EXISTS games_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        message_id TEXT UNIQUE,
        title TEXT NOT NULL,
        content TEXT,
        link TEXT,
        image_url TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
`);

// Create index for faster search
try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_games_title ON games_cache(guild_id, title)");
} catch (e) { /* Index exists */ }

// News History to prevent duplicates
db.exec(`
    CREATE TABLE IF NOT EXISTS news_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        news_guid TEXT UNIQUE,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
`);

// --- BIG SERVER FEATURES TABLES ---

// 1. Season System
db.exec(`
    CREATE TABLE IF NOT EXISTS seasons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        season_number INTEGER,
        name TEXT,
        start_date INTEGER,
        end_date INTEGER,
        is_active INTEGER DEFAULT 1
    )
`);

// 2. Reputation System (Social Credit)
db.exec(`
    CREATE TABLE IF NOT EXISTS reputation (
        user_id TEXT PRIMARY KEY,
        rep_points INTEGER DEFAULT 0,
        last_given INTEGER DEFAULT 0
    )
`);

// 3. Trust Score (Anti-Exploit)
db.exec(`
    CREATE TABLE IF NOT EXISTS trust_score (
        user_id TEXT PRIMARY KEY,
        score INTEGER DEFAULT 100,
        reason TEXT
    )
`);

// 4. Invite Tracking
db.exec(`
    CREATE TABLE IF NOT EXISTS invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inviter_id TEXT,
        invited_id TEXT,
        timestamp INTEGER,
        is_valid INTEGER DEFAULT 1,
        UNIQUE(inviter_id, invited_id)
    )
`);

export default db;
