import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import {
    joinVoiceChannel,
    getVoiceConnection,
    VoiceConnectionStatus,
    entersState
} from '@discordjs/voice';

// Store 24/7 status for guilds: { guildId: boolean }
const alwaysOnStates = new Map();

export const data = new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Voice Channel Controls')
    .addSubcommand(subcommand =>
        subcommand
            .setName('join')
            .setDescription('Join your current voice channel')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('leave')
            .setDescription('Leave the current voice channel')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('247')
            .setDescription('Toggle 24/7 mode (Stay in voice channel indefinitely)')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Connect);

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === 'join') {
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({
                content: '❌ You create join a voice channel first!',
                ephemeral: true
            });
        }

        try {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: false
            });

            // Prevent auto disconnect if 24/7 is enabled
            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                if (alwaysOnStates.get(guildId)) {
                    try {
                        await Promise.race([
                            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                        ]);
                        // Seems to be reconnecting to a new channel - ignore disconnect
                    } catch (error) {
                        // Ideally we would try to rejoin here, but for now we let it destroy if it completely fails
                        if (getVoiceConnection(guildId)) {
                            connection.destroy();
                        }
                    }
                }
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔊 Joined Voice Channel')
                .setDescription(`Connected to **${channel.name}**`)
                .setFooter({ text: 'SantuyTL Voice System' });

            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: '❌ Failed to join voice channel.',
                ephemeral: true
            });
        }
    }

    if (subcommand === 'leave') {
        const connection = getVoiceConnection(guildId);

        if (!connection) {
            return interaction.reply({
                content: '❌ I am not in a voice channel!',
                ephemeral: true
            });
        }

        // Disable 24/7 if enabled
        alwaysOnStates.delete(guildId);

        connection.destroy();

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('👋 Left Voice Channel')
            .setDescription('Disconnected from voice channel.')
            .setFooter({ text: 'SantuyTL Voice System' });

        return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === '247') {
        const connection = getVoiceConnection(guildId);

        if (!connection) {
            return interaction.reply({
                content: '❌ I need to be in a voice channel first! Use `/voice join`',
                ephemeral: true
            });
        }

        const currentState = alwaysOnStates.get(guildId) || false;
        const newState = !currentState;

        alwaysOnStates.set(guildId, newState);

        const embed = new EmbedBuilder()
            .setColor(newState ? '#00AAFF' : '#555555')
            .setTitle(newState ? '♾️ 24/7 Mode ENABLED' : '🛑 24/7 Mode DISABLED')
            .setDescription(newState
                ? 'I will stay in the voice channel until you verify manually kick me or use `/voice leave`.'
                : 'I will disconnect normally if inactive.'
            )
            .setFooter({ text: 'SantuyTL Voice System' });

        return interaction.reply({ embeds: [embed] });
    }
}
