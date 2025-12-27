import { SlashCommandBuilder } from 'discord.js';
import voiceService from '../services/voice.service.js';

export const data = new SlashCommandBuilder()
    .setName('join')
    .setDescription('Suruh bot join ke voice channel tempatmu nongkrong');

export async function execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
        const errorEmbed = {
            description: '❌ **Eits!** Kamu harus masuk ke Voice Channel dulu, baru bisa manggil aku. Jangan malu-malu!',
            color: 0xFF0000
        };
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    try {
        await interaction.deferReply();

        await voiceService.join(interaction.guild, voiceChannel.id);

        const successEmbed = {
            description: `✅ **Berhasil Mendarat!**\nAku udah join di **${voiceChannel.name}**. Ayo ngobrol atau dengerin lagu! 🎧`,
            color: 0x00FF00
        };
        await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
        console.error(error);
        await interaction.editReply('❌ **Gagal Join!** Kayaknya ada masalah teknis atau aku lagi dilarang masuk.');
    }
}
