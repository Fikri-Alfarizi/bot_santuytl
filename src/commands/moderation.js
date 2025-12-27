import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('mod')
    .setDescription('[🛡️ Mod] Perintah moderasi')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers)
    .addSubcommand(sub =>
        sub.setName('kick')
            .setDescription('Tendang user nakal')
            .addUserOption(opt => opt.setName('target').setDescription('User yang mau dikick').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('Alasan')))
    .addSubcommand(sub =>
        sub.setName('ban')
            .setDescription('Banned user selamanya')
            .addUserOption(opt => opt.setName('target').setDescription('User yang mau diban').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('Alasan')))
    .addSubcommand(sub =>
        sub.setName('timeout')
            .setDescription('Bisukan user sementara')
            .addUserOption(opt => opt.setName('target').setDescription('User yang mau di-timeout').setRequired(true))
            .addIntegerOption(opt => opt.setName('duration').setDescription('Durasi (menit)').setRequired(true)));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Tidak ada alasan';
    const member = await interaction.guild.members.fetch(target.id);

    // Bypass check for Owner
    if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== 'YOUR_DEV_ID') {
        // Double check role hierarchy if needed
    }

    if (!member) return interaction.reply({ content: '❌ User tidak ditemukan!', ephemeral: true });
    if (!member.manageable) return interaction.reply({ content: '❌ Gak bisa mod user ini (Role dia lebih tinggi/sama)!', ephemeral: true });

    try {
        if (subcommand === 'kick') {
            await member.kick(reason);
            await interaction.reply(`🦶 **Kicked** ${target.tag} | Alasan: ${reason}`);
        }
        else if (subcommand === 'ban') {
            await member.ban({ reason });
            await interaction.reply(`🔨 **Banned** ${target.tag} | Alasan: ${reason}`);
        }
        else if (subcommand === 'timeout') {
            const duration = interaction.options.getInteger('duration');
            await member.timeout(duration * 60 * 1000, reason);
            await interaction.reply(`🤐 **Timeout** ${target.tag} selama ${duration} menit | Alasan: ${reason}`);
        }
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}
