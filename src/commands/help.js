import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Panduan lengkap fitur bot biar kamu gak bingung');

export async function execute(interaction) {
    const embed = {
        title: '✨ **SANTUY TL BOT INTERFACE** ✨',
        description: `Halo **${interaction.user.username}**! 👋\nSelamat datang di pusat bantuan **SantuyTL**. Di sini kamu bisa cek semua fitur kece yang bikin server ini makin hidup!\n\n> *Pake command dengan awalan \`/\` (slash) ya, jangan lupa!*`,
        color: 0x00A8FF, // Vivid Blue
        thumbnail: {
            url: interaction.client.user.displayAvatarURL()
        },
        image: {
            url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm90eHhidjB3aHJudjR4aHJudjR4aHJudjR4aHJudjR4aHJudjR4eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L2r3K75qYf5Z6/giphy.gif'
        },
        fields: [
            {
                name: '🎮 **FUN & SERU-SERUAN**',
                value: '`/meme` - Asupan meme segar\n`/poll` - Bikin voting biar demokratis\n`/wyr` - Mending mana? (Would You Rather)\n`/giphy` - Nyari GIF lucu\n`/joke` - Jokes bapak-bapak/receh\n`/quote` - Kata-kata hari ini',
                inline: true
            },
            {
                name: '🛠️ **TOOLS KEREN**',
                value: '`/ping` - Cek koneksi bot ngebut gak\n`/say` - Bot jadi juru bicaramu\n`/urban` - Kamus bahasa gaul\n`/weather` - Cek cuaca biar gak kehujanan\n`/suggest` - Ada ide? Bisikin sini',
                inline: true
            },
            {
                name: '\u200b',
                value: '\u200b',
                inline: false
            },
            {
                name: '📈 **STATISTIK & LEVEL**',
                value: '`/leaderboard` - Cek siapa Sultan/Sepuh di sini\n`/profile` - Intip progress level kamu',
                inline: true
            },
            {
                name: '🎵 **MUSIK & VOICE**',
                value: '`/join` - Suruh bot nemenin di voice\n`/leave` - Usir bot dari voice (kasar ya)',
                inline: true
            }
        ],
        footer: {
            text: 'SantuyTL System • Dibuat dengan ☕ & Cinta',
            icon_url: interaction.guild.iconURL()
        },
        timestamp: new Date()
    };

    const row = {
        type: 1,
        components: [
            {
                type: 2,
                style: 5,
                label: '🌐 Website Resmi',
                url: 'https://santuytl.com',
                emoji: '🔗'
            },
            {
                type: 2,
                style: 5,
                label: '📷 Instagram',
                url: 'https://instagram.com/fikrizenterprise',
                emoji: '📸'
            }
        ]
    };

    await interaction.reply({ embeds: [embed], components: [row] });
}
