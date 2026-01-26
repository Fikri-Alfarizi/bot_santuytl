import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek sinyal bot (ngebut atau keong?)');

export async function execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 **PONG!** Mengambil data sinyal...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    let status = '🚀 Ngebut banget!';
    if (latency > 200) status = '🐢 Lumayan santuy...';
    if (latency > 500) status = '🐌 Lemot parah cuuuy!';

    const embed = {
        color: latency < 200 ? 0x00FF00 : 0xE74C3C,
        title: '📶 **NETWORK STATUS**',
        description: `Status: **${status}**`,
        fields: [
            { name: '🤖 Bot Latency', value: `\`${latency} ms\``, inline: true },
            { name: '🌐 API Latency', value: `\`${wsPing} ms\``, inline: true }
        ],
        footer: { text: `Server Region: ${interaction.guild.preferredLocale}` },
        timestamp: new Date()
    };

    await interaction.editReply({ content: '', embeds: [embed] });
}
