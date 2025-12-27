import { Events } from 'discord.js';
import guildService from '../services/guild.service.js';

export const name = Events.GuildMemberAdd;

export async function execute(member) {
    const guildId = member.guild.id;
    const settings = guildService.getSettings(guildId);

    // 1. Auto Role
    if (settings.auto_role_id) {
        try {
            await member.roles.add(settings.auto_role_id);
            console.log(`[AUTO-ROLE] Added role ${settings.auto_role_id} to ${member.user.tag}`);
        } catch (error) {
            console.error('[AUTO-ROLE ERROR]', error.message);
        }
    }

    // 2. Welcome Message
    if (settings.welcome_channel_id) {
        try {
            const channel = await member.guild.channels.fetch(settings.welcome_channel_id);
            if (channel && channel.isTextBased()) {

                const welcomeMsg = settings.welcome_message
                    .replace('{user}', member.toString())
                    .replace('{server}', member.guild.name);

                const embed = {
                    title: `👋 WELCOME TO ${member.guild.name.toUpperCase()}!`,
                    description: `Halo **${member.user.username}**! Selamat bergabung di server kami.\nJangan lupa baca rules dan ambil role ya!\n\n${welcomeMsg}`,
                    color: 0x00A8FF,
                    thumbnail: { url: member.user.displayAvatarURL({ dynamic: true, size: 256 }) },
                    image: { url: 'https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif' }, // General welcome GIF
                    footer: { text: `Member ke-${member.guild.memberCount}` },
                    timestamp: new Date()
                };

                await channel.send({ content: `Selamat datang, ${member}!`, embeds: [embed] });
            }
        } catch (error) {
            console.error('[WELCOME ERROR]', error.message);
        }
    }
}
