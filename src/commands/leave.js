import { SlashCommandBuilder } from 'discord.js';
import voiceService from '../services/voice.service.js';

export const data = new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Suruh bot keluar dari voice channel');

export async function execute(interaction) {
    const status = voiceService.getStatus();

    if (!status.connected) {
        return await interaction.reply({ content: '❌ Bot sedang tidak berada di dalam voice channel.', ephemeral: true });
    }

    // Check if user is in the same voice channel (Optional, generally good practice)
    if (interaction.member.voice.channelId !== status.channelId) {
        // Allow admins or mods to force leave even if not in channel, but for now simple check
        // return await interaction.reply({ content: '❌ Kamu harus berada di channel yang sama dengan bot.', ephemeral: true });
    }

    try {
        const success = voiceService.leave();
        if (success) {
            await interaction.reply('👋 Dadah! Bot keluar dari voice channel.');
        } else {
            await interaction.reply('❌ Gagal keluar.');
        }
    } catch (error) {
        console.error(error);
        await interaction.reply('❌ Terjadi kesalahan saat mencoba keluar.');
    }
}
