import { SlashCommandBuilder } from 'discord.js';
import userService from '../services/user.service.js';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Lihat peringkat member teratas');

export async function execute(interaction) {
    try {
        await interaction.deferReply();

        const users = userService.getLeaderboard(10);

        if (!users || users.length === 0) {
            return await interaction.editReply('Belum ada data leaderboard.');
        }

        const topList = users.map((stat, i) => {
            const name = stat.username || 'Unknown';
            return `**${i + 1}. ${name}** - Level ${stat.level} (${stat.xp} XP)`;
        }).join('\n');

        const embed = {
            title: '🏆 Leaderboard (Top 10)',
            description: topList,
            color: 0xFFD700,
            footer: { text: 'SantuyTL Rank System' }
        };

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('Leaderboard error:', err.message);
        await interaction.editReply('Gagal mengambil leaderboard.');
    }
}
