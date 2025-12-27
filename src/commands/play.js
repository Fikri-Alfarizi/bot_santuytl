import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Putar musik dari YouTube/Spotify')
    .addStringOption(option =>
        option.setName('query')
            .setDescription('Judul lagu atau URL')
            .setRequired(true));

export async function execute(interaction) {
    const player = useMainPlayer();
    const query = interaction.options.getString('query');
    const channel = interaction.member.voice.channel;

    if (!channel) return interaction.reply({ content: '❌ Masuk Voice Channel dulu dong!', ephemeral: true });
    if (!channel.joinable) return interaction.reply({ content: '❌ Bot gak bisa join channel itu (Permission/Full).', ephemeral: true });

    await interaction.deferReply();

    try {
        const { track } = await player.play(channel, query, {
            nodeOptions: {
                metadata: interaction
            }
        });

        return interaction.followUp(`🎶 **Playing:** ${track.title}`);
    } catch (e) {
        console.error(e);
        return interaction.followUp(`❌ Gagal memutar lagu: ${e.message}`);
    }
}
