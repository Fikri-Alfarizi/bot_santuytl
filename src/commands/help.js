import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Panduan lengkap semua fitur SantuyTL');

export async function execute(interaction) {
    const embed = {
        title: '📘 SantuyTL System Manual',
        description: 'Selamat datang di **SantuyTL**. Bot ini lebih dari sekadar command, ini adalah sistem ekosistem server ini.\n\n*Pilih kategori di bawah untuk melihat detail.*',
        color: 0x5865F2,
        thumbnail: { url: interaction.client.user.displayAvatarURL() },
        fields: [
            {
                name: '🏆 Season & Social System',
                value: '`/season` - Cek Rank Musiman & Info Season\n`/rep` - Kasih respect ke player lain (Social Credit)\n`/trust` - Cek Trust Score & Status player\n`/invite` - Cek statistik invite kamu'
            },
            {
                name: '🤖 AI & Smart Assistant',
                value: '`/ai <tanya>` - Chat langsung sama SantuyBot (v1beta)\n*Bisa juga reply pesan bot buat ngobrol lanjut.*'
            },
            {
                name: '💸 Economy & Jobs',
                value: '`/job` - Kerja buat cari receh (Cooldown 1 jam)\n`/work` - Alias buat job\n`/daily` - Jatah preman harian\n`/weekly` - Gaji mingguan\n`/spin` - Judi slot (Awas ketagihan!)'
            },
            {
                name: '🛡️ Moderation & Utilities',
                value: '`/mod` - Kick/Ban/Timeout (Admin Only)\n`/settings` - Atur channel berita & welcome\n`/ping` - Cek latensi bot'
            },
            {
                name: '📢 Automated Systems',
                value: '• **Passive Income:** 60 koin/menit buat yang online.\n• **News Feed:** Berita game auto-update.\n• **Trust Observer:** Bot mantau spammer otomatis.'
            }
        ],
        footer: { text: 'SantuyTL System™ • Season 1' }
    };

    return interaction.reply({ embeds: [embed] });
}
