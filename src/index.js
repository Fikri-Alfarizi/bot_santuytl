import './config/env.js';
import express from 'express';
import client from './config/discord.js';
import apiRoutes from './api/index.js';
import { loadCommands } from './commands/index.js';
import { loadEvents } from './events/index.js';
import cron from 'node-cron';
import { checkAndPostNews } from './services/news.service.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Routes
app.use('/', apiRoutes);

// Health Check
app.get('/status', (req, res) => {
    res.json({ online: true, tag: client.user?.tag || 'Not Logged In' });
});

// Start Express
app.listen(PORT, () => {
    console.log(`HTTP API running on port ${PORT}`);
});

client.once('ready', async () => {
    console.log(`🔥 Bot is ready! Logged in as ${client.user.tag}`);

    // Register commands logic...
    // ...

    // Schedule News Feed (Every 30 minutes)
    cron.schedule('*/30 * * * *', () => {
        checkAndPostNews(client);
    });

    console.log('📰 News Feed System: ACTIVE (Check every 30m)');
});

// Initialize Discord Bot
(async () => {
    await loadCommands(client);
    await loadEvents(client);
    await client.login(process.env.DISCORD_BOT_TOKEN);
})();
