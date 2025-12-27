import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Kirim saran untuk server')
    .addStringOption(option =>
        option.setName('suggestion')
            .setDescription('Saran kamu')
            .setRequired(true));

export async function execute(interaction) {
    const suggestion = interaction.options.getString('suggestion');
    const suggestChannelId = process.env.DISCORD_SUGGEST_CHANNEL_ID || process.env.DISCORD_GAME_CHANNEL_ID;

    if (!suggestChannelId) {
        return await interaction.reply({ content: 'Channel saran belum dikonfigurasi admin.', ephemeral: true });
    }

    try {
        const channel = await interaction.client.channels.fetch(suggestChannelId);
        if (!channel) throw new Error('Channel not found');

        const embed = {
            title: '💡 Saran Baru',
            description: suggestion,
            author: { name: interaction.user.tag, icon_url: interaction.user.displayAvatarURL() },
            color: 0xF1C40F,
            timestamp: new Date()
        };

        const msg = await channel.send({ embeds: [embed] });
        await msg.react('✅');
        await msg.react('❌');

        await interaction.reply({ content: 'Saran kamu berhasil dikirim! Terima kasih.', ephemeral: true });
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Gagal mengirim saran.', ephemeral: true });
    }
}
