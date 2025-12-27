import { Client, GatewayIntentBits } from 'discord.js';

import { Player } from 'discord-player';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ]
});

// Init Music Player
const player = new Player(client);
player.extractors.loadDefault(); // Load YouTube/Spotify extractors

player.events.on('error', (queue, error) => {
    console.log(`[Music Error] ${queue.guild.name}: ${error.message}`);
});
player.events.on('playerError', (queue, error) => {
    console.log(`[Player Error] ${queue.guild.name}: ${error.message}`);
});

export default client;
