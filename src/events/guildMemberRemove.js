import { Events } from 'discord.js';
import guildService from '../services/guild.service.js';

export const name = Events.GuildMemberRemove;

export async function execute(member) {
    const guildId = member.guild.id;
    const settings = guildService.getSettings(guildId);

    // Using "log_channel_id" or "leave_channel_id" if we add one later.
    // For now, let's use welcome channel if leave channel is not explicit, OR check a new column.
    // My schema has 'leave_channel_id'.

    if (settings.leave_channel_id) {
        try {
            const channel = await member.guild.channels.fetch(settings.leave_channel_id);
            if (channel && channel.isTextBased()) {
                const embed = {
                    description: `👋 **${member.user.tag}** baru saja keluar dari server. Sampai jumpa!`,
                    color: 0xFF0000,
                    footer: { text: `Sisa member: ${member.guild.memberCount}` }
                };
                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('[LEAVE ERROR]', error.message);
        }
    }
}
