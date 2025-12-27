import { SlashCommandBuilder } from 'discord.js';
import trustService from '../services/trust.service.js';

export const data = new SlashCommandBuilder()
    .setName('trust')
    .setDescription('Cek Trust Score (Anti-Exploit System)')
    .addUserOption(opt => opt.setName('user').setDescription('User yang mau dicek'));

export async function execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const score = trustService.getTrustScore(targetUser.id);

    let status = '🟢 SAFE';
    let color = 0x2ECC71;

    if (score < 50) {
        status = '🔴 DANGEROUS';
        color = 0xE74C3C;
    } else if (score < 80) {
        status = '🟡 SUSPICIOUS';
        color = 0xF1C40F;
    }

    return interaction.reply({
        embeds: [{
            title: `🕵️ Trust Score: ${targetUser.username}`,
            description: `**Score:** \`${score}/100\`\n**Status:** **${status}**\n\n*Trust Score turun kalau sering spam atau coba exploit bot.*`,
            color: color
        }]
    });
}
