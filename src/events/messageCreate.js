import axios from 'axios';
import { Events, PermissionFlagsBits } from 'discord.js';
import userService from '../services/user.service.js';
import { logSystem } from '../utils/auditLogger.js';

const userMessageCooldown = new Map();
const userSpamTracking = new Map(); // { userId: { channels: Set(), startTime: timestamp } }

export default {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        // --- 🛡️ ANTI-SPAM CROSS CHANNEL CHECK ---
        const SPAM_WINDOW_MS = 15000; // 15 detik window
        const MAX_CHANNELS = 3;

        // Skip Admin/Mod from spam check
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const userId = message.author.id;
            const now = Date.now();

            if (!userSpamTracking.has(userId)) {
                userSpamTracking.set(userId, { channels: new Set(), startTime: now });
            }

            const userData = userSpamTracking.get(userId);

            // Reset warning window if expired
            if (now - userData.startTime > SPAM_WINDOW_MS) {
                userData.channels.clear();
                userData.startTime = now;
            }

            userData.channels.add(message.channel.id);

            // DETECT SPAM
            if (userData.channels.size > MAX_CHANNELS) {
                // Find Moderator Role
                const modRole = message.guild.roles.cache.find(r =>
                    r.name.toLowerCase().includes('mod') ||
                    r.permissions.has(PermissionFlagsBits.KickMembers)
                );
                const modTag = modRole ? `<@&${modRole.id}>` : '@here';

                try {
                    await message.reply({
                        content: `🚨 **WOI SANTAI DONG!** ${message.author} \nJangan nyepam di banyak channel sekaligus elah! Ganggu banget bjir. \n\n${modTag} tolong pantau bocah ini!`
                    });

                    // Reset tracking to prevent double warn immediately
                    userSpamTracking.delete(userId);
                    return; // Stop processing XP/Coins for spammer
                } catch (e) {
                    console.error('Failed to warn spammer:', e);
                }
            }
        }

        // --- AFK CHECK LOGIC ---
        // 1. Check if sender is AFK -> Remove AFK
        const senderAfk = userService.getAfkStatus(message.author.id);
        if (senderAfk && senderAfk.is_afk) {
            userService.removeAfk(message.author.id);

            // Revert nickname if needed
            if (message.member && message.member.manageable && message.member.nickname?.startsWith('[AFK] ')) {
                const newNick = message.member.nickname.replace('[AFK] ', '');
                await message.member.setNickname(newNick).catch(() => { });
            }

            const afkDuration = Date.now() - senderAfk.afk_timestamp;
            const minutes = Math.floor(afkDuration / 60000);

            message.reply(`👋 **Welcome back, ${message.author.username}!**\nKamu AFK selama ${minutes} menit. Status AFK dicabut.`)
                .then(msg => setTimeout(() => msg.delete(), 5000))
                .catch(() => { });
        }

        // 2. Check if mentioned users are AFK
        if (message.mentions.users.size > 0) {
            message.mentions.users.forEach(targetUser => {
                const afkStatus = userService.getAfkStatus(targetUser.id);
                if (afkStatus && afkStatus.is_afk) {
                    const timeAgo = Math.floor(afkStatus.afk_timestamp / 1000);
                    const embed = {
                        description: `💤 **${targetUser.username} sedang AFK**\n📝 Alasan: ${afkStatus.afk_reason}\n⏳ Sejak: <t:${timeAgo}:R>`,
                        color: 0x95A5A6
                    };
                    message.reply({ embeds: [embed] }).catch(() => { });
                }
            });
        }

        // --- EXISTING XP & COIN LOGIC ---
        const WEBHOOK_URL = process.env.WEBHOOK_URL;
        const WEBHOOK_SECRET = process.env.DISCORD_BOT_SECRET;
        const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://127.0.0.1:8000';

        const cooldownAmount = 60 * 1000;
        const now = Date.now();

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

                // 💸 CHAT REWARD NOTIFICATION
                // Reply to user to notify reward (will appear in their notification tag)
                message.reply(`💸 **Caching!** Kamu dapet **${coinsToAdd} coins** dari aktif ngechat!`)
                    .then(msg => setTimeout(() => msg.delete(), 10000)) // Auto delete after 10s to reduce spam
                    .catch(() => { });

                // Add XP Locally
                const result = userService.addXp(message.author.id, message.author.username, xpToAdd);

                if (result.leveledUp) {
                    const levelEmbed = {
                        title: '🚀 **LEVEL UP ALERT!**',
                        description: `Gokil! Selamat bro **${message.author.username}**, kamu naik level!\n\n⭐️ **Level Baru:** \`${result.level}\`\n🔥 **Total XP:** \`${result.xp}\`\n\n*Makin aktif, makin sepuh!*`,
                        color: 0xFF00FF, // Neon Purple
                        thumbnail: { url: message.author.displayAvatarURL({ dynamic: true }) }
                    };
                    message.channel.send({ content: `Congrats ${message.author}! 🎉`, embeds: [levelEmbed] });
                }

            } catch (error) {
                console.error('Error updating local stats:', error.message);
            }
        }

        // --- Activity Logging ---
        if (WEBHOOK_URL) {
            axios.post(WEBHOOK_URL, {
                discord_id: message.author.id,
                event_type: 'user_activity'
            }, {
                headers: { 'X-Discord-Bot-Secret': WEBHOOK_SECRET },
                timeout: 2000 // Short timeout
            }).catch(() => { /* Ignore connection errors */ });
        }

        // --- Meaningful Message Rewards ---
        if (message.content.split(' ').length > 10) {
            userService.addXp(message.author.id, message.author.username, 5);
        }

        // --- Auto Sync Games & Events ---
        const GAME_CHANNEL_ID = process.env.DISCORD_GAME_CHANNEL_ID || '1391274558514004019';
        const EVENT_CHANNEL_ID = process.env.DISCORD_EVENT_CHANNEL_ID || '1439538769148772372';
        const API_GAME_URL = process.env.API_GAME_URL || `${LARAVEL_API_URL}/api/discord/game`;
        const API_EVENT_URL = process.env.API_EVENT_URL || `${LARAVEL_API_URL}/api/discord/event`;

        if (message.channel.id === GAME_CHANNEL_ID) {
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
    }
};
