import db from '../db/index.js';

class GuildService {
    getSettings(guildId) {
        let settings = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
        if (!settings) {
            const info = db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(guildId);
            settings = {
                guild_id: guildId,
                welcome_channel_id: null,
                leave_channel_id: null,
                log_channel_id: null,
                welcome_message: 'Selamat datang {user} di {server}!',
                auto_role_id: null
            };
        }
        return settings;
    }

    updateSetting(guildId, key, value) {
        this.getSettings(guildId); // Ensure exists
        const stmt = db.prepare(`UPDATE guild_settings SET ${key} = ? WHERE guild_id = ?`);
        return stmt.run(value, guildId);
    }
}

export default new GuildService();
