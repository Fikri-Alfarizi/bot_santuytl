import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import gameService from '../services/game.service.js';
import guildService from '../services/guild.service.js';

export const data = new SlashCommandBuilder()
    .setName('game')
    .setDescription('🎮 Cari dan dapatkan link game premium!')
    .addStringOption(opt =>
        opt.setName('nama')
            .setDescription('Ketik nama game yang dicari')
            .setRequired(true)
            .setAutocomplete(true)
    );

/**
 * Autocomplete handler - dipanggil saat user mengetik
 */
export async function autocomplete(interaction) {
    try {
        // Check guild context
        if (!interaction.guild) {
            return interaction.respond([]);
        }

        const query = interaction.options.getFocused();
        const guildId = interaction.guild.id;

        // Search games dari cache
        const games = gameService.searchGames(guildId, query, 25);

        // Format untuk Discord autocomplete
        const choices = games.map(game => ({
            name: game.title.substring(0, 100), // Max 100 chars
            value: game.message_id
        }));

        await interaction.respond(choices);
    } catch (error) {
        console.error('Autocomplete error:', error);
        await interaction.respond([]);
    }
}

/**
 * Execute handler - dipanggil saat user memilih game
 */
export async function execute(interaction) {
    // Check guild context
    if (!interaction.guild) {
        return interaction.reply({
            content: '❌ Command ini hanya bisa digunakan di server!',
            ephemeral: true
        });
    }

    const messageId = interaction.options.getString('nama');
    const guildId = interaction.guild.id;

    // Check jika game source channel sudah di-set
    const settings = guildService.getSettings(guildId);
    if (!settings || !settings.game_source_channel_id) {
        return interaction.reply({
            content: '❌ **Admin belum setup sumber game!**\nMinta admin ketik `/settings gamesource <channel>` dulu.',
            ephemeral: true
        });
    }

    // Get game dari cache
    const game = gameService.getGameByMessageId(messageId);

    if (!game) {
        // Mungkin user ketik manual bukan pilih dari autocomplete
        // Coba search ulang
        const searchResults = gameService.searchGames(guildId, messageId, 1);
        if (searchResults.length === 0) {
            return interaction.reply({
                content: '❌ **Game tidak ditemukan!**\nCoba ketik nama game dan pilih dari daftar yang muncul.',
                ephemeral: true
            });
        }
        // Use first result
        return showGamePreview(interaction, searchResults[0]);
    }

    await showGamePreview(interaction, game);
}

/**
 * Show game preview dengan konfirmasi button
 */
async function showGamePreview(interaction, game) {
    // Truncate content jika terlalu panjang
    let description = game.content || 'Tidak ada deskripsi';
    if (description.length > 500) {
        description = description.substring(0, 500) + '...';
    }

    // Build embed preview
    const embed = {
        title: `🎮 ${game.title}`,
        description: description,
        color: 0x5865F2,
        fields: [
            {
                name: '📦 Status',
                value: 'Klik tombol dibawah untuk mengirim link ke DM kamu!',
                inline: false
            }
        ],
        footer: {
            text: '⚠️ Link akan dikirim secara private ke DM'
        }
    };

    // Add image jika ada
    if (game.image_url) {
        embed.thumbnail = { url: game.image_url };
    }

    // Build buttons
    const confirmButton = new ButtonBuilder()
        .setCustomId(`game_confirm_${game.message_id}`)
        .setLabel('📬 Kirim ke DM')
        .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
        .setCustomId('game_cancel')
        .setLabel('❌ Batal')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    // Send preview
    const response = await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
    });

    // Handle button clicks
    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000 // 1 menit timeout
    });

    collector.on('collect', async i => {
        if (i.customId === 'game_cancel') {
            await i.update({
                content: '❌ **Dibatalkan.**',
                embeds: [],
                components: []
            });
            collector.stop();
        } else if (i.customId.startsWith('game_confirm_')) {
            await sendGameToDM(i, game);
            collector.stop();
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            try {
                await interaction.editReply({
                    content: '⏰ **Waktu habis!** Silakan coba lagi.',
                    embeds: [],
                    components: []
                });
            } catch (e) {
                // Message might be deleted
            }
        }
    });
}

/**
 * Send game details ke DM user
 */
async function sendGameToDM(interaction, game) {
    // Build full game embed untuk DM
    const dmEmbed = {
        title: `🎮 ${game.title}`,
        description: game.content || 'Tidak ada deskripsi',
        color: 0x00FF00,
        fields: [],
        footer: {
            text: `From: ${interaction.guild.name} | Simpan pesan ini!`
        },
        timestamp: new Date()
    };

    // Add link jika ada
    if (game.link) {
        dmEmbed.fields.push({
            name: '📥 Download Link',
            value: game.link,
            inline: false
        });
    }

    // Add image jika ada
    if (game.image_url) {
        dmEmbed.image = { url: game.image_url };
    }

    // Try to send DM
    let dmStatus = '✅ **Link game berhasil dikirim ke DM kamu!**\nCek DM untuk mengambil hadiahnya.';

    try {
        await interaction.user.send({ embeds: [dmEmbed] });
    } catch (error) {
        console.error('Failed to send game DM:', error.message);
        dmStatus = '❌ **Gagal mengirim DM!**\nPastikan DM kamu tidak tertutup (Settings > Privacy & Safety > Allow direct messages from server members).';
    }

    // Update original message
    await interaction.update({
        content: dmStatus,
        embeds: [],
        components: []
    });
}
