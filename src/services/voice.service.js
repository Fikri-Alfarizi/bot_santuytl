import { joinVoiceChannel, entersState, VoiceConnectionStatus } from '@discordjs/voice';

class VoiceService {
    constructor() {
        this.connection = null;
        this.channelId = null;
        this.guildId = null;
        this.connectedAt = null;
    }

    async join(guild, channelId) {
        if (this.connection) {
            this.connection.destroy();
        }

        this.connection = joinVoiceChannel({
            channelId: channelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: true
        });

        this.channelId = channelId;
        this.guildId = guild.id;
        this.connectedAt = new Date();

        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch (error) {
                this.destroy();
            }
        });

        this.connection.on(VoiceConnectionStatus.Destroyed, () => {
            this.reset();
        });

        return this.connection;
    }

    leave() {
        if (this.connection) {
            this.connection.destroy();
            this.reset();
            return true;
        }
        return false;
    }

    getStatus() {
        return {
            connected: !!this.connection,
            channelId: this.channelId,
            guildId: this.guildId,
            connectedAt: this.connectedAt,
            status: this.connection?.state.status
        };
    }

    destroy() {
        if (this.connection) {
            this.connection.destroy();
        }
        this.reset();
    }

    reset() {
        this.connection = null;
        this.channelId = null;
        this.guildId = null;
        this.connectedAt = null;
    }
}

export default new VoiceService();
