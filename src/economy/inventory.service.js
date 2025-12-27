import db from '../db/index.js';

// Create inventory table
db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        expires_at INTEGER,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
`);

class InventoryService {
    /**
     * Add item to user inventory
     */
    addItem(userId, itemId, expiresAt = null, metadata = null) {
        const stmt = db.prepare(`
            INSERT INTO inventory (user_id, item_id, expires_at, metadata)
            VALUES (?, ?, ?, ?)
        `);

        return stmt.run(userId, itemId, expiresAt, metadata ? JSON.stringify(metadata) : null);
    }

    /**
     * Get user inventory
     */
    getUserInventory(userId) {
        const now = Math.floor(Date.now() / 1000);
        const stmt = db.prepare(`
            SELECT * FROM inventory 
            WHERE user_id = ? 
            AND (expires_at IS NULL OR expires_at > ?)
            ORDER BY created_at DESC
        `);

        const items = stmt.all(userId, now);
        return items.map(item => ({
            ...item,
            metadata: item.metadata ? JSON.parse(item.metadata) : null
        }));
    }

    /**
     * Check if user has item
     */
    hasItem(userId, itemId) {
        const now = Math.floor(Date.now() / 1000);
        const stmt = db.prepare(`
            SELECT COUNT(*) as count FROM inventory 
            WHERE user_id = ? AND item_id = ?
            AND (expires_at IS NULL OR expires_at > ?)
        `);

        const result = stmt.get(userId, itemId, now);
        return result.count > 0;
    }

    /**
     * Use/consume item
     */
    useItem(userId, itemId) {
        const stmt = db.prepare(`
            DELETE FROM inventory 
            WHERE id = (
                SELECT id FROM inventory 
                WHERE user_id = ? AND item_id = ?
                LIMIT 1
            )
        `);

        return stmt.run(userId, itemId);
    }

    /**
     * Remove expired items
     */
    cleanExpiredItems() {
        const now = Math.floor(Date.now() / 1000);
        const stmt = db.prepare(`
            DELETE FROM inventory 
            WHERE expires_at IS NOT NULL AND expires_at <= ?
        `);

        return stmt.run(now);
    }
}

export default new InventoryService();
