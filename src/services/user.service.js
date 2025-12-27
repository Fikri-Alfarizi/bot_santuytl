import db from '../db/index.js';

class UserService {
    getUser(userId, username = 'Unknown') {
        let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            const info = db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run(userId, username);
            user = { id: userId, username, xp: 0, level: 1, coins: 0, last_daily: 0 };
        }
        return user;
    }

    addXp(userId, username, amount) {
        const user = this.getUser(userId, username);
        let newXp = user.xp + amount;
        let newLevel = user.level;

        // Simple level up formula: Level * 100 XP
        const xpNeeded = user.level * 100;
        let leveledUp = false;

        if (newXp >= xpNeeded) {
            newXp -= xpNeeded;
            newLevel++;
            leveledUp = true;
        }

        db.prepare('UPDATE users SET xp = ?, level = ?, username = ? WHERE id = ?')
            .run(newXp, newLevel, username, userId);

        return { ...user, xp: newXp, level: newLevel, leveledUp };
    }

    addCoins(userId, username, amount) {
        const user = this.getUser(userId, username);
        const newCoins = user.coins + amount;

        db.prepare('UPDATE users SET coins = ? WHERE id = ?')
            .run(newCoins, userId);

        return { ...user, coins: newCoins };
    }

    getLeaderboard(limit = 10) {
        return db.prepare('SELECT * FROM users ORDER BY level DESC, xp DESC LIMIT ?').all(limit);
    }

    // --- REWARD SYSTEM ---

    checkDaily(userId) {
        const user = this.getUser(userId);
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; // 24 hours
        const lastDaily = user.last_daily || 0;

        if (now - lastDaily < cooldown) {
            return { available: false, remaining: cooldown - (now - lastDaily) };
        }
        return { available: true };
    }

    claimDaily(userId, username, amount) {
        const check = this.checkDaily(userId);
        if (!check.available) return false;

        const now = Date.now();
        this.addCoins(userId, username, amount);
        db.prepare('UPDATE users SET last_daily = ? WHERE id = ?').run(now, userId);
        return true;
    }

    checkWeekly(userId) {
        const user = this.getUser(userId);
        const now = Date.now();
        const cooldown = 7 * 24 * 60 * 60 * 1000; // 7 days
        const lastWeekly = user.last_weekly || 0;

        if (now - lastWeekly < cooldown) {
            return { available: false, remaining: cooldown - (now - lastWeekly) };
        }
        return { available: true };
    }

    claimWeekly(userId, username, amount) {
        const check = this.checkWeekly(userId);
        if (!check.available) return false;

        const now = Date.now();
        this.addCoins(userId, username, amount);
        db.prepare('UPDATE users SET last_weekly = ? WHERE id = ?').run(now, userId);
        return true;
    }

    // --- AFK SYSTEM ---

    setAfk(userId, username, reason) {
        this.getUser(userId, username); // Ensure user exists
        const now = Date.now();
        db.prepare('UPDATE users SET is_afk = 1, afk_reason = ?, afk_timestamp = ? WHERE id = ?')
            .run(reason, now, userId);
    }

    removeAfk(userId) {
        db.prepare('UPDATE users SET is_afk = 0, afk_reason = NULL, afk_timestamp = 0 WHERE id = ?')
            .run(userId);
    }

    getAfkStatus(userId) {
        const user = db.prepare('SELECT is_afk, afk_reason, afk_timestamp FROM users WHERE id = ?').get(userId);
        return user || { is_afk: 0 };
    }
}

export default new UserService();
