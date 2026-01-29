import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import guildService from '../services/guild.service.js';

export const data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('[👑 Admin] Konfigurasi fitur server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
        sub.setName('welcome')
            .setDescription('Set channel welcome')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel tujuan').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('logs')
            .setDescription('Set channel logs')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel tujuan').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('autorole')
            .setDescription('Set auto role saat member join')
            .addRoleOption(opt => opt.setName('role').setDescription('Role yang dikasih').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('gamesource')
            .setDescription('Set channel sumber Game Premium (untuk /spin)')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel sumber game').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('request')
            .setDescription('Set channel tempat user request game')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel tujuan').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('news')
            .setDescription('Set channel untuk berita game otomatis')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel tujuan').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('chat')
            .setDescription('Set channel untuk Bot Gemini ngobrol otomatis')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel tujuan').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('alarm-channel')
            .setDescription('Set channel untuk alarm harian')
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel tujuan').setRequired(true)))
    .addSubcommand(sub =>
        sub.setName('alarm-schedule')
            .setDescription('Set jadwal alarm harian (format: HH:MM, contoh: 07:00)')
            .addStringOption(opt => opt.setName('jam').setDescription('Jam alarm (HH:MM)').setRequired(true)));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === 'welcome') {
        const channel = interaction.options.getChannel('channel');
        guildService.updateSetting(guildId, 'welcome_channel_id', channel.id);
        await interaction.reply(`✅ **Welcome Channel** berhasil diset ke ${channel}`);
    }
    else if (subcommand === 'logs') {
        const channel = interaction.options.getChannel('channel');
        guildService.updateSetting(guildId, 'log_channel_id', channel.id);
        await interaction.reply(`✅ **Log Channel** berhasil diset ke ${channel}`);
    }
    else if (subcommand === 'autorole') {
        const role = interaction.options.getRole('role');
        guildService.updateSetting(guildId, 'auto_role_id', role.id);
        await interaction.reply(`✅ **Auto Role** berhasil diset ke **${role.name}**`);
    }
    else if (subcommand === 'gamesource') {
        const channel = interaction.options.getChannel('channel');
        guildService.updateSetting(guildId, 'game_source_channel_id', channel.id);
        await interaction.reply(`✅ **Game Source** berhasil diset ke ${channel}.\nBot akan mengambil stok game dari chat di channel tersebut untuk fitur \`/spin\`.`);
    }
    else if (subcommand === 'request') {
        const channel = interaction.options.getChannel('channel');
        guildService.updateSetting(guildId, 'request_channel_id', channel.id);
        await interaction.reply(`✅ **Request Channel** berhasil diset ke ${channel}.\nSemua request user akan masuk ke sini dengan tampilan keren!`);
    }
    else if (subcommand === 'news') {
        const channel = interaction.options.getChannel('channel');
        guildService.updateSetting(guildId, 'news_channel_id', channel.id);
        await interaction.reply(`✅ **Game News Channel** berhasil diset ke ${channel}.\nBerita game terbaru (Steam & Scene) akan muncul otomatis di sini tiap 30 menit.`);
    }
    else if (subcommand === 'chat') {
        const channel = interaction.options.getChannel('channel');
        guildService.updateSetting(guildId, 'general_chat_channel_id', channel.id);
        await interaction.reply(`✅ **AI Chat Channel** berhasil diset ke ${channel}.\nBot Gemini akan mulai nongkrong & ngobrol otomatis di sini jam 7, 12, 15, dan 21!`);
    }
    else if (subcommand === 'alarm-channel') {
        const channel = interaction.options.getChannel('channel');
        guildService.updateSetting(guildId, 'alarm_channel_id', channel.id);
        await interaction.reply(`✅ **Alarm Channel** berhasil diset ke ${channel}.\nGambar alarm harian akan dikirim ke channel ini sesuai jadwal yang ditentukan!`);
    }
    else if (subcommand === 'alarm-schedule') {
        const jam = interaction.options.getString('jam');
        // Validate format HH:MM
        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(jam)) {
            await interaction.reply('❌ **Format jam salah!** Gunakan format HH:MM (contoh: 07:00, 08:30, 14:00)');
            return;
        }
        guildService.updateSetting(guildId, 'alarm_schedule', jam);
        await interaction.reply(`✅ **Jadwal Alarm** berhasil diset ke **${jam} WIB**.\nAlarm akan dikirim otomatis setiap hari pada jam tersebut!`);
    }
}
