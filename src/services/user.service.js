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
}

export default new UserService();
