import { SlashCommandBuilder } from 'discord.js';
import db from '../db/index.js';
import guildService from '../services/guild.service.js';

export const data = new SlashCommandBuilder()
    .setName('spin')
    .setDescription('Putar slot untuk dapatkan Game Premium Gratis (Max 2x/hari)');

export async function execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    // 1. Cek Source Channel Config
    const settings = guildService.getSettings(guildId);
    if (!settings.game_source_channel_id) {
        return interaction.reply({
            content: '❌ **Admin belum setup sumber game!**\nMinta admin ketik `/settings gamesource <channel>` dulu.',
            ephemeral: true
        });
    }

    // 2. Cek Limit Harian
    const user = db.prepare('SELECT daily_spins, last_spin_time FROM users WHERE id = ?').get(userId);
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    const lastSpinDate = new Date(user?.last_spin_time || 0).setHours(0, 0, 0, 0);

    let spinsToday = (user?.daily_spins || 0);

    // Reset jika hari beda
    if (lastSpinDate < today) {
        spinsToday = 0;
    }

    if (spinsToday >= 2) {
        return interaction.reply({
            content: '🛑 **Limit Harian Habis!**\nSabar gacha addict, balik lagi besok ya (Max 2x sehari).',
            ephemeral: true
        });
    }

    await interaction.deferReply();

    // 3. Fetch Games dari Channel
    try {
        const sourceChannel = await interaction.guild.channels.fetch(settings.game_source_channel_id);

        // Ambil 50 pesan terakhir
        const messages = await sourceChannel.messages.fetch({ limit: 50 });
        const validGames = messages.filter(m => !m.author.bot && m.content.length > 5); // Filter bot & pesan pendek

        if (validGames.size === 0) {
            return interaction.editReply('❌ **Stok Game Kosong!**\nChannel game premium lagi sepi nih.');
        }

        // 4. Update Kuota User
        db.prepare(`
            UPDATE users 
            SET daily_spins = ?, last_spin_time = ? 
            WHERE id = ?
        `).run(spinsToday + 1, now, userId);

        // 5. Animasi Slot Machine
        const slots = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🎰'];
        const msg = await interaction.editReply({
            content: '🎰 **MEMUTAR SLOT...**\n⬜ ⬜ ⬜'
        });

        // Simulasi putaran (3 frames)
        for (let i = 0; i < 3; i++) {
            const a = slots[Math.floor(Math.random() * slots.length)];
            const b = slots[Math.floor(Math.random() * slots.length)];
            const c = slots[Math.floor(Math.random() * slots.length)];
            await msg.edit(`🎰 **MEMUTAR SLOT...**\n${a} ${b} ${c}`);
            await new Promise(r => setTimeout(r, 800));
        }

        // Hasil Akhir (Jackpot Effect visual aja, hadiah tetap dapet 1 random)
        const prizeMsg = validGames.random();

        // Cek Image dari Attachment atau Embeds
        let prizeImage = null;
        if (prizeMsg.attachments.size > 0) {
            prizeImage = prizeMsg.attachments.first().url;
        } else if (prizeMsg.embeds.length > 0 && prizeMsg.embeds[0].image) {
            prizeImage = prizeMsg.embeds[0].image.url;
        } else if (prizeMsg.embeds.length > 0 && prizeMsg.embeds[0].thumbnail) {
            prizeImage = prizeMsg.embeds[0].thumbnail.url;
        }

        await msg.edit(`🎰 **JACKPOT!**\n💎 💎 💎\n\n🎉 **Selamat! Kamu dapat Game Premium!**\nCek DM kamu sekarang!`);

        // 6. Kirim Hadiah via DM
        const prizeEmbed = {
            title: '🎁 HADIAH SPIN PREMIUM',
            description: `Selamat! Ini hadiah game kamu:\n\n${prizeMsg.content}\n\n*Screenshot jika perlu, pesan ini aman.*`,
            color: 0xFFD700,
            image: prizeImage ? { url: prizeImage } : undefined,
            footer: { text: `Dari server: ${interaction.guild.name}` }
        };

        try {
            await interaction.user.send({ embeds: [prizeEmbed] });
        } catch (e) {
            await interaction.followUp({ content: '❌ Gagal kirim DM! Pastikan DM kamu open ya.', ephemeral: true });
        }

    } catch (error) {
        console.error(error);
        await interaction.editReply('❌ **Error Sistem!** Gagal mengambil data game.');
    }
}
