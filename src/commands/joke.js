import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';

export const data = new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Kirim lelucon acak');

export async function execute(interaction) {
    try {
        const res = await axios.get('https://v2.jokeapi.dev/joke/Any?safe-mode');
        const joke = res.data;
        const content = joke.type === 'single' ? joke.joke : `${joke.setup}\n\n||${joke.delivery}||`;
        await interaction.reply({ content: `😂 **JOKE:**\n${content}` });
    } catch (err) {
        await interaction.reply({ content: 'Gagal mengambil joke.', ephemeral: true });
    }
}
