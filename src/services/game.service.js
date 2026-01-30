import db from '../db/index.js';
import guildService from './guild.service.js';

/**
 * Game Service - Handle game caching and searching
 * Untuk fitur /game dengan autocomplete
 */
class GameService {
    /**
     * Sync games dari premium channel ke database cache
     * @param {Client} client - Discord client
     * @param {string} guildId - Guild ID
     * @returns {number} - Jumlah games yang di-sync
     */
    async syncGamesFromChannel(client, guildId) {
        const settings = guildService.getSettings(guildId);

        if (!settings || !settings.game_source_channel_id) {
            console.log(`⏭️ Skip sync games for guild ${guildId} - no source channel`);
            return 0;
        }

        try {
            const channel = await client.channels.fetch(settings.game_source_channel_id);
            if (!channel || !channel.isTextBased()) {
                console.error(`Channel ${settings.game_source_channel_id} not valid`);
                return 0;
            }

            // Fetch messages (limit 100 per batch, bisa diulang untuk lebih)
            let allMessages = [];
            let lastId = null;

            // Fetch up to 500 messages (5 batches)
            for (let i = 0; i < 5; i++) {
                const options = { limit: 100 };
                if (lastId) options.before = lastId;

                const messages = await channel.messages.fetch(options);
                if (messages.size === 0) break;

                allMessages = allMessages.concat([...messages.values()]);
                lastId = messages.last().id;

                if (messages.size < 100) break;
            }

            // Filter hanya message valid (bukan bot, ada content)
            const validMessages = allMessages.filter(m => !m.author.bot && m.content.length > 5);

            // Clear old cache untuk guild ini
            db.prepare('DELETE FROM games_cache WHERE guild_id = ?').run(guildId);

            // Insert new games
            const insertStmt = db.prepare(`
                INSERT OR REPLACE INTO games_cache 
                (guild_id, message_id, title, content, link, image_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            let count = 0;
            for (const msg of validMessages) {
                const parsed = this.parseGameMessage(msg);
                if (parsed.title) {
                    insertStmt.run(
                        guildId,
                        msg.id,
                        parsed.title,
                        parsed.content,
                        parsed.link,
                        parsed.imageUrl,
                        Math.floor(msg.createdTimestamp / 1000)
                    );
                    count++;
                }
            }

            console.log(`✅ Synced ${count} games for guild ${guildId}`);
            return count;

        } catch (error) {
            console.error(`❌ Error syncing games for guild ${guildId}:`, error.message);
            return 0;
        }
    }

    /**
     * Parse game message untuk extract title, link, image
     */
    parseGameMessage(message) {
        const lines = message.content.split('\n');

        // Title: baris pertama (biasanya nama game)
        let title = lines[0] || 'Unknown Game';
        // Batasi panjang title untuk autocomplete (max 100 chars)
        title = title.substring(0, 100);

        // Link: cari URL dalam content
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links = message.content.match(urlRegex);
        const link = links ? links[0] : null;

        // Image: dari attachment atau embed
        let imageUrl = null;
        if (message.attachments.size > 0) {
            imageUrl = message.attachments.first().url;
        } else if (message.embeds.length > 0 && message.embeds[0].image) {
            imageUrl = message.embeds[0].image.url;
        }

        return {
            title: title.trim(),
            content: message.content,
            link,
            imageUrl
        };
    }

    /**
     * Search games untuk autocomplete
     * @param {string} guildId - Guild ID
     * @param {string} query - Search query
     * @param {number} limit - Max results (default 25 for Discord autocomplete)
     * @returns {Array} - List of matching games
     */
    searchGames(guildId, query, limit = 25) {
        if (!query || query.length < 1) {
            // Jika query kosong, return games terbaru
            return db.prepare(`
                SELECT * FROM games_cache 
                WHERE guild_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `).all(guildId, limit);
        }

        // Search dengan LIKE (case insensitive)
        const searchQuery = `%${query}%`;
        return db.prepare(`
            SELECT * FROM games_cache 
            WHERE guild_id = ? AND title LIKE ?
            ORDER BY 
                CASE WHEN title LIKE ? THEN 0 ELSE 1 END,
                created_at DESC
            LIMIT ?
        `).all(guildId, searchQuery, `${query}%`, limit);
    }

    /**
     * Get single game by message ID
     */
    getGameByMessageId(messageId) {
        return db.prepare('SELECT * FROM games_cache WHERE message_id = ?').get(messageId);
    }

    /**
     * Get game count for a guild
     */
    getGameCount(guildId) {
        const result = db.prepare('SELECT COUNT(*) as count FROM games_cache WHERE guild_id = ?').get(guildId);
        return result?.count || 0;
    }

    /**
     * Sync all guilds
     */
    async syncAllGuilds(client) {
        console.log('🎮 Starting games sync for all guilds...');
        const guilds = client.guilds.cache;
        let totalGames = 0;

        for (const [guildId, guild] of guilds) {
            const count = await this.syncGamesFromChannel(client, guildId);
            totalGames += count;
        }

        console.log(`🎮 Total games synced: ${totalGames}`);
        return totalGames;
    }
}

export default new GameService();
