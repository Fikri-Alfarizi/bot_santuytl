import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } from 'discord.js';
import inventoryService from '../economy/inventory.service.js';
import { getItemById } from '../economy/shop.items.js';

export const data = new SlashCommandBuilder()
    .setName('use')
    .setDescription('Pakai item dari inventory tanpa ribet');

export async function execute(interaction) {
    const userId = interaction.user.id;
    const inventory = inventoryService.getUserInventory(userId);

    // Filter usable items? (Or just show all and handle usage logic)
    // Let's filter distinct items to avoid duplicates in list, or map unique purchase IDs if we track individually.
    // Inventory Service returns list of items. If 2 keys, 2 rows.
    // For "Use", grouping by item_id is usually better unless unique metadata matters.
    // Let's Group by Item ID for the menu.
    const distinctItems = [];
    const seen = new Set();

    for (const inv of inventory) {
        if (!seen.has(inv.item_id)) {
            const def = getItemById(inv.item_id);
            if (def) {
                distinctItems.push({ ...inv, def });
                seen.add(inv.item_id);
            }
        }
    }

    if (distinctItems.length === 0) {
        return interaction.reply({ content: '🎒 **Tas kamu kosong!** Gak ada yang bisa dipakai.', ephemeral: true });
    }

    // Build Menu
    const options = distinctItems.slice(0, 25).map(item => {
        return new StringSelectMenuOptionBuilder()
            .setLabel(item.def.name)
            .setDescription(item.def.type === 'role' ? 'Pasang Role (Durasi)' : 'Gunakan item ini')
            .setValue(item.item_id)
            .setEmoji('⚡');
    });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('use_select_item')
        .setPlaceholder('Pilih item yang mau dipakai...')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const reply = await interaction.reply({
        content: '🛠️ **Pilih item yang mau digunakan:**',
        components: [row],
        ephemeral: true,
        fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

    collector.on('collect', async i => {
        const itemId = i.values[0];
        const itemDef = getItemById(itemId);

        // Usage Logic
        let successMessage = '';
        try {
            switch (itemDef.type) {
                case 'role':
                    if (itemDef.roleId) {
                        const member = await i.guild.members.fetch(userId);
                        await member.roles.add(itemDef.roleId);
                        successMessage = `🎉 **ROLE DIPASANG!**\nKamu sekarang punya role <@&${itemDef.roleId}>.`;
                    } else {
                        successMessage = '⚠️ Config role bermasalah.';
                    }
                    break;
                case 'xp_boost':
                    successMessage = '⚡ **XP Boost Diaktifkan!** (Effect simulated)';
                    break;
                case 'premium_spin_ticket':
                    successMessage = '🎟️ **Tiket ini otomatis dipakai di `/spin` Premium!** Gak perlu di-klik di sini.';
                    // Don't consume here? Or consume? "Use" usually consumes.
                    // If it's used in /spin, maybe warn user?
                    // Let's return warning and NOT consume
                    return i.update({ content: '🛑 **Salah Tempat!**\nTiket ini otomatis dipakai saat kamu ketik `/spin` dan pilih tombol Premium.', components: [] });
                default:
                    successMessage = `✅ **${itemDef.name}** berhasil dipakai!`;
                    break;
            }

            // Consume
            inventoryService.useItem(userId, itemId);

            await i.update({
                content: '',
                embeds: [{
                    title: '✅ **ITEM DIGUNAKAN**',
                    description: successMessage,
                    color: 0x00FF00
                }],
                components: []
            });

        } catch (e) {
            console.error(e);
            await i.update({ content: '❌ Gagal menggunakan item.', components: [] });
        }
    });
}
