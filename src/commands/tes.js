import { SlashCommandBuilder } from 'discord.js';
import { testAlarmImage } from '../services/alarm.service.js';

export const data = new SlashCommandBuilder()
    .setName('tes')
    .setDescription('Test alarm webhook - mengirim gambar alarm');

export async function execute(interaction) {
    // Defer reply karena webhook bisa memakan waktu
    await interaction.deferReply({ ephemeral: true });

    try {
        // Kirim gambar melalui webhook
        const success = await testAlarmImage();

        if (success) {
            await interaction.editReply({
                content: '✅ **Test berhasil!** Gambar alarm telah dikirim melalui webhook.',
                ephemeral: true
            });
        } else {
            await interaction.editReply({
                content: '❌ **Test gagal!** Terjadi kesalahan saat mengirim gambar.',
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Error in /tes command:', error);
        await interaction.editReply({
            content: '❌ **Error!** Terjadi kesalahan: ' + error.message,
            ephemeral: true
        });
    }
}
