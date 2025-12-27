import express from 'express';
import voiceService from '../services/voice.service.js';
import client from '../config/discord.js';

const router = express.Router();

// GET /voice/channels
router.get('/channels', async (req, res) => {
    try {
        const guildId = process.env.DISCORD_GUILD_ID || client.guilds.cache.first()?.id;
        if (!guildId) return res.json({ channels: [] });

        const guild = await client.guilds.fetch(guildId);
        if (!guild) return res.json({ channels: [] });

        await guild.channels.fetch();

        const voiceChannels = guild.channels.cache
            .filter(channel => channel.type === 2) // GUIILD_VOICE
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                members: channel.members.size
            }));

        res.json({ channels: voiceChannels });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /voice/join
router.post('/join', async (req, res) => {
    try {
        const { guild_id, channel_id } = req.body;
        if (!guild_id || !channel_id) {
            return res.status(400).json({ error: 'guild_id dan channel_id wajib diisi' });
        }

        const guild = await client.guilds.fetch(guild_id);
        const channel = await guild.channels.fetch(channel_id);

        if (!channel || channel.type !== 2) {
            return res.status(404).json({ error: 'Channel bukan voice channel' });
        }

        await voiceService.join(guild, channel_id);
        res.json({ success: true, message: 'Bot berhasil join voice channel', channel: channel.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /voice/leave
router.post('/leave', async (req, res) => {
    try {
        if (voiceService.leave()) {
            res.json({ success: true, message: 'Bot berhasil leave voice channel' });
        } else {
            res.status(400).json({ error: 'Bot tidak sedang di voice channel' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /voice/status
router.get('/status', async (req, res) => {
    try {
        const status = voiceService.getStatus();

        let channelName = 'Unknown';
        let guildName = 'Unknown';

        if (status.channelId && status.guildId) {
            const guild = await client.guilds.fetch(status.guildId).catch(() => null);
            if (guild) {
                guildName = guild.name;
                const channel = await guild.channels.fetch(status.channelId).catch(() => null);
                if (channel) channelName = channel.name;
            }
        }

        const duration = status.connectedAt ? Math.floor((new Date() - status.connectedAt) / 1000) : 0;

        res.json({
            ...status,
            channel_name: channelName,
            guild_name: guildName,
            duration
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
