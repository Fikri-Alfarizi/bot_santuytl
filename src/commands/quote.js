import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';

export const data = new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Kirim kutipan inspiratif');

export async function execute(interaction) {
    try {
        const res = await axios.get('https://zenquotes.io/api/random');
        const quote = res.data[0];
        const embed = {
            description: `*"${quote.q}"*`,
            footer: { text: `- ${quote.a}` },
            color: 0x9B59B6
        };
        await interaction.reply({ embeds: [embed] });
    } catch (err) {
        await interaction.reply({ content: 'Gagal mengambil quote.', ephemeral: true });
    }
}
