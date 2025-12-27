import { SlashCommandBuilder } from 'discord.js';
import voiceService from '../services/voice.service.js';

export const data = new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Usir bot dari voice channel (Baik-baik ya)');

export async function execute(interaction) {
    const status = voiceService.getStatus();

    if (!status.connected) {
        const errorEmbed = {
            description: '❓ **Lho?** Aku kan gak lagi di Voice Channel manapun. Hantu kali yang kamu liat? 👻',
            color: 0xFFA500
        };
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    try {
        const success = voiceService.leave();
        if (success) {
            const successEmbed = {
                description: '👋 **Oke deh, aku pamit!**\nJangan kangen ya. Panggil lagi kalo butuh! 🏃‍♂️💨',
                color: 0x00A8FF
            };
            await interaction.reply({ embeds: [successEmbed] });
        } else {
            await interaction.reply('❌ **Duh!** Susah banget keluarnya. Error nih!');
        }
    } catch (error) {
        console.error(error);
        await interaction.reply('❌ **Error Sistem!** Gagal melakukan pemutusan hubungan kerja.');
    }
}
