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
            const name = stat.username || 'Unknown';
            const rankEmoji = i < 3 ? topThreeEmojis[i] : `\` #${i + 1} \``;

            // Layout: Rank - Name - Stats
            // Bold name for top 3
            const formattedName = i < 3 ? `**${name.toUpperCase()}**` : name;

            return `${rankEmoji} ${formattedName}\n\`\`\`yaml\nLevel: ${stat.level} | XP: ${stat.xp.toLocaleString()}\`\`\``;
        }).join('\n');

        // Find self rank
        const selfRankIndex = users.findIndex(u => u.id === interaction.user.id);
        const selfRankText = selfRankIndex !== -1
            ? `🔥 Kamu peringkat #${selfRankIndex + 1}`
            : '👀 Kamu belum masuk Top 10. Gas push rank!';

        const embed = {
            title: '🏆 **HALL OF FAME (TOP 10)**',
            description: '*Ranking ini diupdate secara realtime berdasarkan aktivitas sedunia (server).*',
            color: 0xFFD700, // Gold
            thumbnail: {
                url: interaction.guild.iconURL({ dynamic: true })
            },
            fields: [
                { name: '🔥 **ELITE LEADERBOARD**', value: topList || 'Belum ada data' }
            ],
            image: {
                url: 'https://media.giphy.com/media/l46CimW38a7EQxMcM/giphy.gif'
            },
            footer: { text: selfRankText },
            timestamp: new Date()
        };

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('Leaderboard error:', err.message);
        await interaction.editReply('❌ Aduh, sistem ranking lagi ngadat. Coba lagi nanti ya!');
    }
}
