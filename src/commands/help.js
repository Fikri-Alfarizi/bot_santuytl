import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tampilkan panduan lengkap dan daftar command');

export async function execute(interaction) {
    const embed = {
        title: '✨ **SantuyTL Bot Interface** ✨',
        description: `Halo **${interaction.user.username}**! 👋\nIni adalah daftar command yang bisa kamu gunakan untuk bersenang-senang dan melihat statistik di server ini.\n\n> *Gunakan command dengan awalan \`/\` (slash) di chat.*`,
        color: 0x00FFFF, // Cyan Bright
        thumbnail: {
            url: interaction.client.user.displayAvatarURL()
        },
        image: {
            url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm90eHhidjB3aHJudjR4aHJudjR4aHJudjR4aHJudjR4aHJudjR4eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L2r3K75qYf5Z6/giphy.gif' // Aesthetic GIF Banner
        },
        fields: [
            {
                name: '🎮 **FUN & GAMES**',
                value: '`/meme` - Cari meme/stiker lucu\n`/poll` - Buat voting\n`/wyr` - Would You Rather?\n`/giphy` - Cari GIF\n`/joke` - Lelucon receh\n`/quote` - Kutipan bijak',
                inline: true
            },
            {
                name: '🛠️ **UTILITY**',
                value: '`/ping` - Cek latency bot\n`/say` - Bot menirukan teksmu\n`/urban` - Kamus gaul\n`/weather` - Cek cuaca\n`/suggest` - Kirim saran',
                inline: true
            },
            {
                name: '\u200b', // Empty field to force new line if needed, or just let them stack
                value: '\u200b',
                inline: false
            },
            {
                name: '📈 **ECONOMY & STATS**',
                value: '`/leaderboard` - Top 10 Rank\n`/profile` - Cek stats & progress level',
                inline: true
            },
            {
                name: '🎵 **VOICE**',
                value: '`/join` - Masuk voice channel\n`/leave` - Keluar voice channel',
                inline: true
            }
        ],
        footer: {
            text: 'Dibuat dengan ❤️ oleh Fikri | SantuyTL',
            icon_url: interaction.guild.iconURL()
        },
        timestamp: new Date()
    };

    // Button links (Optional, but adds to "UI yang sangat menarik")
    const row = {
        type: 1, // ActionRow
        components: [
            {
                type: 2, // Button
                style: 5, // Link
                label: '🌐 Website',
                url: 'https://santuytl.com' // Dummy link or real one
            },
            {
                type: 2,
                style: 5,
                label: '📷 Instagram',
                url: 'https://instagram.com/fikrizenterprise'
            }
        ]
    };

    await interaction.reply({ embeds: [embed], components: [row] });
}
