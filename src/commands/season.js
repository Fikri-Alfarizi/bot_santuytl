import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import seasonService from '../services/season.service.js';
import db from '../db/index.js';

export const data = new SlashCommandBuilder()
    .setName('season')
    .setDescription('Sistem Season Server (Info & Leaderboard)')
    .addSubcommand(sub =>
        sub.setName('info')
            .setDescription('Cek info season saat ini'))
    .addSubcommand(sub =>
        sub.setName('leaderboard')
            .setDescription('Lihat top player di season ini'))
    .addSubcommand(sub =>
        sub.setName('start')
            .setDescription('[Admin] Mulai season baru')
            .addStringOption(opt => opt.setName('nama').setDescription('Nama Season').setRequired(true))
            .addIntegerOption(opt => opt.setName('durasi').setDescription('Durasi (hari)').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('end')
            .setDescription('[Admin] Akhiri season saat ini'));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'info') {
        const current = seasonService.getCurrentSeason();
        if (!current) {
            return interaction.reply('⚠️ Belum ada Season yang berjalan. Minta admin mulai dulu!');
        }

        const timeLeft = seasonService.getSeasonTimeLeft();
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

        return interaction.reply({
            embeds: [{
                title: `🏆 Season ${current.season_number}: ${current.name}`,
                description: `Season ini lagi jalan bro! Kejar rank-nya!\n\n⏳ **Berakhir dalam:** ${daysLeft} hari\n📅 **Mulai:** <t:${Math.floor(current.start_date / 1000)}:R>`,
                color: 0xFFD700
            }]
        });
    }

    if (subcommand === 'leaderboard') {
        const topUsers = db.prepare('SELECT username, seasonal_xp FROM users ORDER BY seasonal_xp DESC LIMIT 10').all();

        if (topUsers.length === 0) return interaction.reply('Belum ada data player buat season ini.');

        const leaderboard = topUsers.map((u, i) =>
            `**#${i + 1}** ${u.username} — ✨ ${u.seasonal_xp} XP`
        ).join('\n');

        return interaction.reply({
            embeds: [{
                title: '🔥 Season Leaderboard',
                description: leaderboard,
                color: 0xFFA500,
                footer: { text: 'Reset setiap season berakhir!' }
            }]
        });
    }

    // ADMIN COMMANDS
    if (subcommand === 'start') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '🚫 Khusus Admin woi!', ephemeral: true });
        }

        const name = interaction.options.getString('nama');
        const duration = interaction.options.getInteger('durasi');

        const newSeason = seasonService.startNewSeason(name, duration);

        // Reset Seasonal XP for everyone
        db.prepare('UPDATE users SET seasonal_xp = 0').run();

        return interaction.reply(`🎉 **SEASON BARU DIMULAI!**\n\n🏆 **Season ${newSeason.season_number}: ${newSeason.name}**\n⏳ Durasi: ${duration} hari.\n\nSemua **Seasonal XP** sudah di-reset ke 0. Let's go!!`);
    }

    if (subcommand === 'end') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '🚫 Khusus Admin woi!', ephemeral: true });
        }

        const current = seasonService.getCurrentSeason();
        if (current) {
            seasonService.endSeason(current.id);
            return interaction.reply(`🏁 Season **${current.name}** telah diakhiri secara manual.`);
        } else {
            return interaction.reply('Gak ada season yang aktif.');
        }
    }
}
