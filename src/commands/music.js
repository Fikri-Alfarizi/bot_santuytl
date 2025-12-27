import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('music')
    .setDescription('🎵 Kontrol Musik (Skip, Stop, Queue)')
    .addSubcommand(sub => sub.setName('skip').setDescription('Skip lagu sekarang'))
    .addSubcommand(sub => sub.setName('stop').setDescription('Stop & Disconnect bot'))
    .addSubcommand(sub => sub.setName('queue').setDescription('Lihat antrian lagu'));

export async function execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    const sub = interaction.options.getSubcommand();

    if (!queue || !queue.isPlaying()) {
        return interaction.reply({ content: '❌ Gak ada lagu yang lagi diputar!', ephemeral: true });
    }

    if (sub === 'skip') {
        queue.node.skip();
        return interaction.reply('⏩ Lagu di-skip!');
    }

    if (sub === 'stop') {
        queue.delete();
        return interaction.reply('⏹️ Musik berhenti. Bye bye!');
    }

    if (sub === 'queue') {
        const tracks = queue.tracks.toArray();
        const current = queue.currentTrack;

        let msg = `▶️ **Now Playing:** ${current.title}\n\n`;

        if (tracks.length > 0) {
            msg += `**Next Up:**\n` + tracks.slice(0, 10).map((t, i) => `${i + 1}. ${t.title}`).join('\n');
            if (tracks.length > 10) msg += `\n...dan ${tracks.length - 10} lagu lainnya.`;
        } else {
            msg += '(Antrian kosong)';
        }

        return interaction.reply({ content: msg, ephemeral: true });
    }
}
