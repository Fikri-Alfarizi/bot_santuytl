import { SlashCommandBuilder } from 'discord.js';
import userService from '../services/user.service.js';

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Cek profil statistik kamu (XP, Level, Coins)')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User yang ingin dicek (Opsional)'));

export async function execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;

    // Get stats from DB
    const userData = userService.getUser(targetUser.id, targetUser.username);
    const member = await interaction.guild.members.fetch(targetUser.id);

    // Calculate XP needed for next level (Simple: Level * 100)
    const xpNeeded = userData.level * 100;
    const progress = Math.floor((userData.xp / xpNeeded) * 100);

    // Create progress bar
    const barLength = 10;
    const filled = Math.floor(progress / (100 / barLength));
    const empty = barLength - filled;
    const progressBar = '▓'.repeat(filled) + '░'.repeat(empty);

    const embed = {
        title: `👤 Profil ${targetUser.username}`,
        thumbnail: { url: targetUser.displayAvatarURL({ dynamic: true, size: 256 }) },
        color: member.displayColor || 0x00A2FF,
        fields: [
            { name: '🎖️ Level', value: `**${userData.level}**`, inline: true },
            { name: '💰 Coins', value: `**${userData.coins.toLocaleString()}**`, inline: true },
            { name: '✨ XP Progress', value: `${userData.xp} / ${xpNeeded} XP\n\`[${progressBar}] ${progress}%\``, inline: false },
            { name: '📅 Bergabung', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: false }
        ],
        footer: { text: 'SantuyTL Economy System' }
    };

    await interaction.editReply({ embeds: [embed] });
}
