import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('say')
    .setDescription('Replies with your input!')
    .addStringOption(option =>
        option.setName('input')
            .setDescription('The input to echo back')
            .setRequired(true));

export async function execute(interaction) {
    const input = interaction.options.getString('input');

    // Use Embed to verify identity (Anti-Impersonation)
    const embed = {
        description: `📢 **${input}**`,
        color: 0x00A8FF,
        author: {
            name: interaction.user.username + ' berkata:',
            icon_url: interaction.user.displayAvatarURL()
        }
    };

    await interaction.reply({ embeds: [embed] });
}
