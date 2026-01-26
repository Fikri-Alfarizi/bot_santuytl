import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { SHOP_ITEMS, getItemById, getItemsByType } from '../economy/shop.items.js';
import userService from '../services/user.service.js';
import inventoryService from '../economy/inventory.service.js';
import { logEconomy } from '../utils/auditLogger.js';

export const data = new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Buka Santuy Mart: Belanja Role, Boost, dan Gacha!');

export async function execute(interaction) {
    // 1. Initial Interface (Categories)
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('shop_category_select')
        .setPlaceholder('Pilih kategori belanja...')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('👑 Roles')
                .setDescription('Status Sultan, VIP, dan Custom Color')
                .setValue('role')
                .setEmoji('👑'),
            new StringSelectMenuOptionBuilder()
                .setLabel('⚡ Boosters')
                .setDescription('XP Double, Coin Double!')
                .setValue('boost')
                .setEmoji('⚡'),
            new StringSelectMenuOptionBuilder()
                .setLabel('🎲 Gacha Stuff')
                .setDescription('Tiket Spin Premium dan barang hoki')
                .setValue('gacha')
                .setEmoji('🎲'),
            new StringSelectMenuOptionBuilder()
                .setLabel('🛠️ Utility')
                .setDescription('Rename bot, dll.')
                .setValue('utility')
                .setEmoji('🛠️'),
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const initialEmbed = {
        title: '🛒 **SANTUY MART - WELCOME!**',
        description: 'Selamat datang di pusat perbelanjaan nomor 1 di server ini!\nPilih kategori di bawah untuk melihat barang-barang jualan kami.',
        color: 0x00A8FF,
        thumbnail: { url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiSEQ/giphy.gif' },
        fields: [
            { name: '💳 Saldo Kamu', value: `\`RP ${userService.getUser(interaction.user.id, interaction.user.username).coins.toLocaleString()}\``, inline: true }
        ],
        footer: { text: 'Klik dropdown di bawah 👇' }
    };

    const response = await interaction.reply({
        embeds: [initialEmbed],
        components: [row],
        ephemeral: true
    });

    // 2. Collector for Categories
    const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

    collector.on('collect', async i => {
        const selection = i.values[0];

        // Show Item Selection for that Category
        if (['role', 'boost', 'gacha', 'utility'].includes(selection)) {
            await handleShowCategory(i, selection);
        }
    });
}

// Handler: Show Items in Category
async function handleShowCategory(interaction, category) {
    const items = SHOP_ITEMS.filter(item => item.category === category);

    if (items.length === 0) {
        return interaction.reply({ content: '❌ Stok kosong di kategori ini!', ephemeral: true });
    }

    const itemOptions = items.map(item =>
        new StringSelectMenuOptionBuilder()
            .setLabel(`${item.name} - RP ${item.price.toLocaleString()}`)
            .setDescription(item.description.substring(0, 100))
            .setValue(`buy_${item.id}`)
    );

    const selectItemMenu = new StringSelectMenuBuilder()
        .setCustomId('shop_item_select')
        .setPlaceholder(`Pilih barang dari ${category.toUpperCase()}...`)
        .addOptions(itemOptions);

    const row = new ActionRowBuilder().addComponents(selectItemMenu);

    const embed = {
        title: `📂 **KATEGORI: ${category.toUpperCase()}**`,
        description: 'Pilih barang yang mau kamu beli dari menu di bawah ini:',
        color: 0xFFA500,
        fields: items.map(item => ({
            name: `${item.name}`,
            value: `💰 \`RP ${item.price.toLocaleString()}\`\n📝 ${item.description}`,
            inline: false
        }))
    };

    // Update original message or reply new (Update is better for flow)
    await interaction.update({
        embeds: [embed],
        components: [row]
    });

    // Create sub-collector for item selection
    const message = await interaction.fetchReply();
    const itemCollector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

    itemCollector.on('collect', async i => {
        if (i.values[0].startsWith('buy_')) {
            const itemId = i.values[0].replace('buy_', '');
            await handleConfirmBuy(i, itemId);
        }
    });
}

// Handler: Confirm Buy Page
async function handleConfirmBuy(interaction, itemId) {
    const item = getItemById(itemId);
    const user = userService.getUser(interaction.user.id, interaction.user.username);

    const confirmButton = new ButtonBuilder()
        .setCustomId(`confirm_buy_${itemId}`)
        .setLabel(`BELI SEKARANG (RP ${item.price.toLocaleString()})`)
        .setStyle(ButtonStyle.Success)
        .setEmoji('💸');

    const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_buy')
        .setLabel('BATAL')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const embed = {
        title: '🤔 **KONFIRMASI PEMBELIAN**',
        description: `Kamu yakin mau beli barang ini?\n\n📦 **${item.name}**\n📝 ${item.description}\n\n💰 **Harga:** \`RP ${item.price.toLocaleString()}\`\n💳 **Saldo Kamu:** \`RP ${user.coins.toLocaleString()}\``,
        color: 0xFFFF00,
        footer: { text: user.coins < item.price ? '⚠️ DUIT KURANG BOS!' : 'Gas beli!' }
    };

    await interaction.update({
        embeds: [embed],
        components: [row]
    });

    // Final Collector for Button
    const message = await interaction.fetchReply();
    const buttonCollector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    buttonCollector.on('collect', async i => {
        if (i.customId === 'cancel_buy') {
            await i.update({ content: '👌 Transaksi dibatalkan.', embeds: [], components: [] });
            return;
        }

        if (i.customId.startsWith('confirm_buy_')) {
            await processTransaction(i, itemId);
        }
    });
}

// Logic: Process Transaction
async function processTransaction(interaction, itemId) {
    const item = getItemById(itemId);
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const user = userService.getUser(userId, username);

    if (user.coins < item.price) {
        return interaction.update({
            content: `❌ **GAGAL!** Duitmu kurang.\nButuh: \`RP ${item.price}\`\nPunya: \`RP ${user.coins}\``,
            embeds: [],
            components: []
        });
    }

    try {
        // 1. Kurangi Coin
        userService.addCoins(userId, username, -item.price);

        // 2. Add to Inventory
        const expiresAt = item.duration ? Math.floor((Date.now() + item.duration) / 1000) : null;
        inventoryService.addItem(userId, item.id, expiresAt, {
            originalPrice: item.price,
            boughtAt: new Date().toISOString()
        });

        // 3. Log
        logEconomy('BUY_ITEM', interaction.user, item.price, `Bought (Shop UI): ${item.name}`);

        const successEmbed = {
            title: '✅ **PEMBELIAN BERHASIL!**',
            description: `Selamat! **${item.name}** sudah masuk inventory kamu.\nGunakan \`/inventory\` untuk cek barangnya.`,
            color: 0x00FF00,
            image: { url: 'https://media.giphy.com/media/l0HlOaQcLn2h7uO2I/giphy.gif' },
            footer: { text: `Sisa Saldo: RP ${(user.coins - item.price).toLocaleString()}` }
        };

        await interaction.update({
            embeds: [successEmbed],
            components: []
        });

    } catch (error) {
        console.error(error);
        await interaction.update({ content: '❌ Error saat memproses transaksi.', components: [] });
    }
}
