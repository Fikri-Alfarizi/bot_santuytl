import {
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
    EmbedBuilder
} from 'discord.js';
import userService from '../services/user.service.js';
import { TOPUP_PACKAGES } from '../economy/topup.config.js';
import { logEconomy } from '../utils/auditLogger.js';

export const data = new SlashCommandBuilder()
    .setName('topup')
    .setDescription('Isi ulang Coins via Dana/QRIS (Aman & Cepat)');

const PACKAGES = TOPUP_PACKAGES;

export async function execute(interaction) {
    // 1. Show Packages
    const options = PACKAGES.map(pkg =>
        new StringSelectMenuOptionBuilder()
            .setLabel(`${pkg.label} (+${pkg.bonus})`)
            .setDescription(`Harga: RP ${pkg.price.toLocaleString()}`)
            .setValue(pkg.id)
            .setEmoji('💰')
    );

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('topup_package_select')
        .setPlaceholder('Pilih Paket Topup...')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setTitle('💎 **TOPUP COINS STORE**')
        .setDescription('Pilih paket coins yang kamu mau. Dapatkan bonus untuk pembelian lebih besar!')
        .setColor(0xF1C40F)
        .addFields(
            { name: 'Metode Pembayaran', value: '✅ **Dana / QRIS** (Scan & Bayar)', inline: true },
            { name: 'Cara Kerja', value: '1. Pilih Paket\n2. Transfer sesuai nominal\n3. Upload Bukti / Konfirmasi\n4. Admin Cek & Coins Masuk!', inline: false }
        )
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/2504/2504929.png') // Generic Coin Icon
        .setFooter({ text: 'Secure Transaction by SantuyTL' });

    const reply = await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
        fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

    collector.on('collect', async i => {
        const pkgId = i.values[0];
        const pkg = PACKAGES.find(p => p.id === pkgId);

        // Generate Transaction ID
        const trxId = `TRX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

        // Payment Info Embed
        const paymentEmbed = new EmbedBuilder()
            .setTitle(`💳 **TAGIHAN PEMBAYARAN**`)
            .setDescription(`**TRX ID:** \`${trxId}\`\n\nSilakan transfer tepat **RP ${pkg.price.toLocaleString()}** ke:`)
            .addFields(
                { name: '📱 DANA', value: `\`${process.env.PAYMENT_EWALLET_NUMBER || 'Hubungi Admin'}\``, inline: true },
                { name: '🖼️ QRIS', value: 'Scan QR di bawah ini (jika ada)', inline: true }
            )
            .setImage(process.env.PAYMENT_QRIS_URL || null)
            .setColor(0x00A8FF)
            .setFooter({ text: 'Klik "Sudah Bayar" setelah transfer!' });

        const btnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_pay_${trxId}_${pkgId}`)
                .setLabel('✅ Sudah Bayar')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setLabel('Batal')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('cancel_pay')
        );

        await i.update({
            content: '',
            embeds: [paymentEmbed],
            components: [btnRow]
        });
    });
}
