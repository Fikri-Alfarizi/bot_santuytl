import { Client, GatewayIntentBits } from 'discord.js';
import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';

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

// Load Extractors (Async IIFE because top-level await might be risky in some setups, but here we just fire and forget or use .then)
(async () => {
    await player.extractors.loadMulti(DefaultExtractors);
    console.log('🎵 Music Extractors Loaded!');
})();

player.events.on('error', (queue, error) => {
    console.log(`[Music Error] ${queue.guild.name}: ${error.message}`);
});
player.events.on('playerError', (queue, error) => {
    console.log(`[Player Error] ${queue.guild.name}: ${error.message}`);
});

export default client;
