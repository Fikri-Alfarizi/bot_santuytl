import { SlashCommandBuilder } from 'discord.js';
import voiceService from '../services/voice.service.js';

export const data = new SlashCommandBuilder()
    .setName('join')
    .setDescription('Suruh bot masuk ke voice channel kamu');

export async function execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
        return await interaction.reply({ content: '❌ Kamu harus masuk ke voice channel dulu!', ephemeral: true });
    }

    try {
        await interaction.deferReply();

        await voiceService.join(interaction.guild, voiceChannel.id);

        await interaction.editReply({ content: `✅ Berhasil join ke **${voiceChannel.name}**! 🔊` });
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: '❌ Gagal join voice channel.' });
    }
}
