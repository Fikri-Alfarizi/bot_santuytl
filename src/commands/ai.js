import { SlashCommandBuilder } from 'discord.js';
import { askGemini } from '../services/gemini.service.js';

export const data = new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Ngobrol santuy sama bot (Tanya apa aja!)')
    .addStringOption(option =>
        option.setName('pertanyaan')
            .setDescription('Tanya apa bro?')
            .setRequired(true));

export async function execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('pertanyaan');

    const response = await askGemini(interaction.user.username, query);

    // Color based on length (Short=Blue, Long=Purple)
    const color = response.length > 500 ? 0x9B59B6 : 0x3498DB;

    // Split if too long (Basic handling, usually Geminin is concise)
    const finalResponse = response.length > 1900 ? response.substring(0, 1900) + '... (Output truncated)' : response;

    const embed = {
        author: {
            name: 'Santuy AI Assistant (BETA)',
            icon_url: interaction.client.user.displayAvatarURL()
        },
        description: finalResponse,
        color: color,
        footer: { text: `Asked by ${interaction.user.username} • Powered by Gemini` },
        timestamp: new Date()
    };

    await interaction.editReply({ embeds: [embed] });
}
