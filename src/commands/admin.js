import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ComponentType, ChannelType, PermissionFlagsBits } from 'discord.js';
import guildService from '../services/guild.service.js';

export const data = new SlashCommandBuilder()
    .setName('admin')
    .setDescription('👑 One-Stop Admin Dashboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator); // Default restrict to admin, but logic will check owner/allowed roles

/**
 * Handle Slash Command /admin
 */
export async function execute(interaction) {
    if (!guildService.isAdmin(interaction)) {
        return interaction.reply({
            content: '📛 **Access Denied!**\nHanya Owner dan Role Admin yang diizinkan mengakses dashboard ini.',
            ephemeral: true
        });
    }

    await showDashboard(interaction);
}

/**
 * Show Main Dashboard
 */
async function showDashboard(interaction, isUpdate = false) {
    const guild = interaction.guild;
    const settings = guildService.getSettings(guild.id);
    const adminRoles = guildService.getAdminRoles(guild.id);

    // Quick Stats
    const memberCount = guild.memberCount;
    const adminCount = adminRoles.length;
    const channelsConfigured = Object.values(settings).filter(v => v && typeof v === 'string' && v.length > 10).length;

    const embed = new EmbedBuilder()
        .setTitle(`🛡️ ADMIN DASHBOARD: ${guild.name}`)
        .setDescription('Selamat datang di panel kontrol terpusat. Pilih menu di bawah untuk mengelola server.')
        .addFields(
            { name: '👥 Members', value: `${memberCount}`, inline: true },
            { name: '👮 Admin Roles', value: `${adminCount} roles`, inline: true },
            { name: '⚙️ Configured', value: `${channelsConfigured} settings`, inline: true },
        )
        .setColor(0x2B2D31)
        .setThumbnail(guild.iconURL());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('admin_menu_settings').setLabel('⚙️ Settings').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('admin_menu_mod').setLabel('🛡️ Moderation').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('admin_menu_access').setLabel('👮 Access Control').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('admin_close').setLabel('❌ Close').setStyle(ButtonStyle.Secondary)
    );

    const payload = { content: '', embeds: [embed], components: [row], ephemeral: true };

    if (isUpdate) {
        await interaction.update(payload);
    } else {
        await interaction.reply(payload);
    }
}

/**
 * Settings Panel (Channel Configs)
 */
async function showSettingsPanel(interaction) {
    const settings = guildService.getSettings(interaction.guildId);

    const embed = new EmbedBuilder()
        .setTitle('⚙️ SERVER SETTINGS')
        .setDescription('Pilih channel untuk setiap fitur di bawah ini. Perubahan langsung tersimpan.')
        .setColor(0x3498DB);

    // Channel Selectors
    // Discord limits: 5 rows max.

    // Row 1: Welcome Channel
    const row1 = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('admin_set_welcome')
            .setPlaceholder('👋 Set Welcome Channel')
            .setChannelTypes(ChannelType.GuildText)
            .setDefaultChannels(settings.welcome_channel_id ? [settings.welcome_channel_id] : [])
    );

    // Row 2: Log Channel
    const row2 = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('admin_set_log')
            .setPlaceholder('📜 Set Log Channel')
            .setChannelTypes(ChannelType.GuildText)
            .setDefaultChannels(settings.log_channel_id ? [settings.log_channel_id] : [])
    );

    // Row 3: Level Up Channel
    const row3 = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('admin_set_levelup')
            .setPlaceholder('🎉 Set Level Up & Coins Channel')
            .setChannelTypes(ChannelType.GuildText)
            .setDefaultChannels(settings.levelup_channel_id ? [settings.levelup_channel_id] : [])
    );

    // Row 4: Game Source (Shared with /spin)
    const row4 = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('admin_set_gamesource')
            .setPlaceholder('🎮 Set Game Source Channel')
            .setChannelTypes(ChannelType.GuildText)
            .setDefaultChannels(settings.game_source_channel_id ? [settings.game_source_channel_id] : [])
    );

    // Row 5: Navigation
    const row5 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('admin_home').setLabel('🏠 Back to Home').setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [row1, row2, row3, row4, row5] });
}

/**
 * Access Control Panel
 */
async function showAccessPanel(interaction) {
    const guildId = interaction.guildId;
    const allowedRoles = guildService.getAdminRoles(guildId);

    const rolesDescription = allowedRoles.length > 0
        ? allowedRoles.map(id => `<@&${id}>`).join(', ')
        : '*Belum ada role tambahan (Hanya Owner)*';

    const embed = new EmbedBuilder()
        .setTitle('👮 ACCESS CONTROL')
        .setDescription(`Role di bawah ini diizinkan mengakses command \`/admin\`.\n\n**Allowed Roles:**\n${rolesDescription}`)
        .setColor(0x95A5A6);

    const rowSelect = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId('admin_add_role')
            .setPlaceholder('➕ Tambah Role Admin')
    );

    const rowRemove = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId('admin_remove_role')
            .setPlaceholder('➖ Hapus Role Admin')
    );

    const rowNav = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('admin_home').setLabel('🏠 Back to Home').setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [rowSelect, rowRemove, rowNav] });
}

/**
 * Moderation Panel
 */
async function showModPanel(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🛡️ MODERATION PANEL')
        .setDescription('Shortcut untuk tindakan moderasi.')
        .setColor(0xE74C3C);

    // Modals are triggered by buttons, but we can't easily do User Select -> Modal in one go without complex temporary collection.
    // Simplest flow: Button -> Modal (Type User ID) OR Button -> User Select -> Immediate Action (Kick/Ban)

    // Let's use User Select Menu for target
    const userSelect = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder() // Placeholder explanation
            .setCustomId('admin_mod_dummy')
            .setPlaceholder('⬇️ Pilih Member di bawah untuk Kick/Ban')
            .setOptions([{ label: 'Fitur ini segera hadir!', value: 'comming_soon' }])
            .setDisabled(true)
    );

    // Note: Discord UserSelectMenu is available: UserSelectMenuBuilder
    // But handling valid user input for moderation usually requires reason input. 
    // Flow: Select User -> Modal (Reason) -> Action.

    // For now, let's keep it simple: Just Buttons that reply with instructions or simple actions
    // Or maybe list ban list? 
    // Let's implement basic "Coming Soon" for now or simpler "Manage Bans"?
    // User requested: "ban, kick ... bisa pilih mereka semua lalu apply". 
    // Let's stick to simple UI first.

    const rowNav = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('admin_home').setLabel('🏠 Back to Home').setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [userSelect, rowNav] });
}


/**
 * Central Interaction Handler for Admin Components
 * Called from interactionCreate.js
 */
export async function handleAdminInteraction(interaction) {
    // Security Check
    if (!guildService.isAdmin(interaction)) {
        return interaction.reply({ content: '🚫 Access Denied.', ephemeral: true });
    }

    const { customId } = interaction;

    // Navigation
    if (customId === 'admin_home') return showDashboard(interaction, true);
    if (customId === 'admin_menu_settings') return showSettingsPanel(interaction);
    if (customId === 'admin_menu_mod') return showModPanel(interaction);
    if (customId === 'admin_menu_access') return showAccessPanel(interaction);
    if (customId === 'admin_close') return interaction.deleteReply();

    // Settings logic (Channel Selects)
    if (customId.startsWith('admin_set_')) {
        const settingKeyMap = {
            'admin_set_welcome': 'welcome_channel_id',
            'admin_set_log': 'log_channel_id',
            'admin_set_levelup': 'levelup_channel_id',
            'admin_set_gamesource': 'game_source_channel_id'
        };

        const key = settingKeyMap[customId];
        if (key) {
            const channelId = interaction.values[0];
            guildService.updateSetting(interaction.guildId, key, channelId);
            // Re-render panel to show updated state (Discord Select Menu default values update)
            await showSettingsPanel(interaction);

            // Optional: Ephemeral confirmation?
            // await interaction.followUp({ content: `✅ Saved!`, ephemeral: true });
        }
    }

    // Access Control Logic
    if (customId === 'admin_add_role') {
        const roleId = interaction.values[0];
        guildService.addAdminRole(interaction.guildId, roleId);
        await showAccessPanel(interaction);
    }
    if (customId === 'admin_remove_role') {
        const roleId = interaction.values[0];
        guildService.removeAdminRole(interaction.guildId, roleId);
        await showAccessPanel(interaction);
    }
}
