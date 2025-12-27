import { SlashCommandBuilder } from 'discord.js';
import userService from '../services/user.service.js';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Lihat 10 orang paling sepuh di server');

export async function execute(interaction) {
    try {
        await interaction.deferReply();

        const users = userService.getLeaderboard(10);

        if (!users || users.length === 0) {
            const errorEmbed = {
                description: '🚫 **Belum ada data!** Server ini masih sepi kayak hati jomblo.',
                color: 0xFF0000
            };
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        const topThreeEmojis = ['👑', '🥈', '🥉'];
        const topList = users.map((stat, i) => {
            const name = stat.username || 'Unknown Warrior';
            const rankEmoji = i < 3 ? topThreeEmojis[i] : `\`#${i + 1}\``;
            const highlight = i === 0 ? '**' : ''; // Bold for #1

            return `${rankEmoji} ${highlight}${name}${highlight}\n┗  Level ${stat.level} • ✨ ${stat.xp.toLocaleString()} XP`;
        }).join('\n\n');

        const embed = {
            title: '🏆 **HALL OF FAME (TOP 10)**',
            description: '*Mereka yang paling aktif, paling "no-life", dan paling sepuh di sini! Hormat!* 🫡\n\n' + topList,
            color: 0xFFD700, // Gold
            thumbnail: {
                url: interaction.guild.iconURL({ dynamic: true })
            },
            image: {
                url: 'https://media.giphy.com/media/l46CimW38a7EQxMcM/giphy.gif' // Victory/Trophy GIF
            },
            footer: { text: 'SantuyTL Ranking System • Update Realtime' },
            timestamp: new Date()
        };

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('Leaderboard error:', err.message);
        await interaction.editReply('❌ Aduh, sistem ranking lagi ngadat. Coba lagi nanti ya!');
    }
}
