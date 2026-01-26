import { SlashCommandBuilder } from 'discord.js';
import inventoryService from '../economy/inventory.service.js';
import { getItemById } from '../economy/shop.items.js';

export const data = new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Cek tas inventaris kamu');

export async function execute(interaction) {
    await interaction.deferReply();

    const items = inventoryService.getUserInventory(interaction.user.id);
    const user = userService.getUser(interaction.user.id, interaction.user.username);

    if (items.length === 0) {
        return await interaction.editReply({
            content: '🎒 **Tas kamu kosong melompong!**',
            embeds: [{
                description: 'Belum ada barang di sini. Yuk belanja dulu di `/shop`!',
                color: 0x95A5A6
            }]
        });
    }

    // Grouping
    const grouped = {};
    items.forEach(invItem => {
        const itemDef = getItemById(invItem.item_id);
        const type = itemDef ? itemDef.type : 'unknown';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push({ ...invItem, def: itemDef });
    });

    const fields = [];
    const typeEmojis = {
        role: '👑',
        consumable: '🍬',
        xp_boost: '⚡',
        coin_boost: '💰',
        utility: '🛠️',
        unknown: '❓'
    };

    const typeNames = {
        role: 'Exclusive Roles',
        consumable: 'Consumables',
        xp_boost: 'XP Boosters',
        coin_boost: 'Coin Boosters',
        utility: 'Tools & Utility',
        unknown: 'Mystery Items'
    };

    for (const [type, invItems] of Object.entries(grouped)) {
        const itemList = invItems.map((item, i) => {
            const name = item.def ? item.def.name : `Unknown Item (${item.item_id})`;
            // Format expiry if exists
            const properties = [];
            if (item.expires_at) properties.push(`⏳ <t:${item.expires_at}:R>`);
            if (item.def?.duration) properties.push(`🕒 Durasi: ${item.def.duration / 3600000} Jam`);

            const propsText = properties.length > 0 ? `\n└ ${properties.join(' • ')}` : '';

            return `> **${i + 1}. ${name}**${propsText}`;
        }).join('\n');

        fields.push({
            name: `${typeEmojis[type] || '📦'} **${typeNames[type] || type.toUpperCase()}**`,
            value: itemList,
            inline: false
        });
    }

    const embed = {
        title: `🎒 **TAS INVENTARIS**`,
        description: `Pemilik: **${interaction.user.username}**\nTotal Barang: **${items.length}** items`,
        color: 0xF1C40F,
        thumbnail: { url: interaction.user.displayAvatarURL() },
        fields: fields,
        footer: { text: '💡 Pakai item? Gunakan command yang sesuai fitur!' }
    };

    await interaction.editReply({ embeds: [embed] });
}
