import axios from 'axios';
import userService from '../services/user.service.js';

const userMessageCooldown = new Map();

export default {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const WEBHOOK_URL = process.env.WEBHOOK_URL;
        const WEBHOOK_SECRET = process.env.DISCORD_BOT_SECRET;
        const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://127.0.0.1:8000';

        // --- Coin & XP System (LOCAL SQLITE) ---
        const now = Date.now();
        const cooldownAmount = 60 * 1000;

        let shouldReward = false;
        if (userMessageCooldown.has(message.author.id)) {
            const expirationTime = userMessageCooldown.get(message.author.id) + cooldownAmount;
            if (now >= expirationTime) {
                shouldReward = true;
            }
        } else {
            shouldReward = true;
        }

        if (shouldReward) {
            userMessageCooldown.set(message.author.id, now);
            const coinsToAdd = Math.floor(Math.random() * 5) + 1;
            const xpToAdd = Math.floor(Math.random() * 15) + 10;

            try {
                // Add Coins Locally
                userService.addCoins(message.author.id, message.author.username, coinsToAdd);

                // Add XP Locally
                const result = userService.addXp(message.author.id, message.author.username, xpToAdd);

                if (result.leveledUp) {
                    message.channel.send(`🎉 Selamat ${message.author}, kamu naik ke **Level ${result.level}**!`);
                }

            } catch (error) {
                console.error('Error updating local stats:', error.message);
            }
        }

        // --- Activity Logging (Keep Webhook if needed for website display, otherwise optional) ---
        // If the user strictly wanted "lepas dari Laravel", we might remove this too.
        // But let's keep it in a try-catch for "activity feed" if the Laravel app is up, 
        // but suppress errors if it's down.
        if (WEBHOOK_URL) {
            axios.post(WEBHOOK_URL, {
                discord_id: message.author.id,
                event_type: 'user_activity'
            }, {
                headers: { 'X-Discord-Bot-Secret': WEBHOOK_SECRET },
                timeout: 2000 // Short timeout
            }).catch(() => { /* Ignore connection errors */ });
        }

        // --- Meaningful Message Rewards & Role Sync (Simplified) ---
        if (message.content.split(' ').length > 10) {
            // Extra XP
            userService.addXp(message.author.id, message.author.username, 5);
        }

        // --- Auto Sync Games & Events (Keep for now, but handle errors gracefully) ---
        const GAME_CHANNEL_ID = process.env.DISCORD_GAME_CHANNEL_ID || '1391274558514004019';
        const EVENT_CHANNEL_ID = process.env.DISCORD_EVENT_CHANNEL_ID || '1439538769148772372';
        const API_GAME_URL = process.env.API_GAME_URL || `${LARAVEL_API_URL}/api/discord/game`;
        const API_EVENT_URL = process.env.API_EVENT_URL || `${LARAVEL_API_URL}/api/discord/event`;

        if (message.channel.id === GAME_CHANNEL_ID) {
            // ... (sync logic kept but safely wrapped)
            const lines = message.content.split('\n');
            const title = lines[0] || 'Game Baru';
            const link = lines[1] || '';
            const description = lines.slice(2).join('\n');
            let image = null;
            if (message.attachments.size > 0) image = message.attachments.first().url;

            axios.post(API_GAME_URL, {
                title, link, description, image, discord_message_id: message.id
            }, { timeout: 3000 }).catch(() => { });
        }

        if (message.channel.id === EVENT_CHANNEL_ID) {
            const lines = message.content.split('\n');
            const title = lines[0] || 'Event Baru';
            const date = lines[1] || null;
            const description = lines.slice(2).join('\n');
            let image = null;
            if (message.attachments.size > 0) image = message.attachments.first().url;

            axios.post(API_EVENT_URL, {
                title, date, description, image, discord_message_id: message.id
            }, { timeout: 3000 }).catch(() => { });
        }
    },
};
