import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('rolepanel')
    .setDescription('🎨 Manage Role Panels (Take Role)')
    // .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles) // Disabled for visibility debugging
    .addSubcommand(sub =>
        sub.setName('create')
            .setDescription('Create a new role panel embed')
            .addStringOption(opt => opt.setName('title').setDescription('Panel Title').setRequired(true))
            .addStringOption(opt => opt.setName('description').setDescription('Panel Description').setRequired(true))
            .addStringOption(opt => opt.setName('image').setDescription('Image URL (Banner)'))
            .addStringOption(opt => opt.setName('color').setDescription('Hex Color (e.g. #FF0000)'))
            .addStringOption(opt => opt.setName('footer').setDescription('Footer Text'))
    )
    .addSubcommand(sub =>
        sub.setName('add')
            .setDescription('Add a role button to the last role panel in this channel')
            .addRoleOption(opt => opt.setName('role').setDescription('Role to add').setRequired(true))
            .addStringOption(opt => opt.setName('label').setDescription('Button Label (Text)').setRequired(true))
            .addStringOption(opt => opt.setName('emoji').setDescription('Button Emoji'))
            .addStringOption(opt => opt.setName('style').setDescription('Button Style/Color').addChoices(
                { name: 'Blue (Primary)', value: 'Primary' },
                { name: 'Grey (Secondary)', value: 'Secondary' },
                { name: 'Green (Success)', value: 'Success' },
                { name: 'Red (Danger)', value: 'Danger' }
            ))
    );

export async function execute(interaction) {
    try {
        const subcommand = interaction.options.getSubcommand();

        // Safety check for DM or missing member
        if (!interaction.guild || !interaction.member) {
            return interaction.reply({ content: '❌ Command ini hanya bisa digunakan di dalam Server.', ephemeral: true });
        }

        // Manual Permission Check
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: '🚫 Kamu butuh permission **Manage Roles** untuk pakai ini!', ephemeral: true });
        }

        if (subcommand === 'create') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const image = interaction.options.getString('image');
            let colorInput = interaction.options.getString('color') || '#2B2D31';

            // Sanitize Color Input (Remove quotes if user pasted them)
            colorInput = colorInput.replace(/['"]/g, '').trim();
            // Ensure hash prefix
            if (!colorInput.startsWith('#') && /^[0-9A-F]{6}$/i.test(colorInput)) {
                colorInput = `#${colorInput}`;
            }

            // Final validation (Fallback to default if invalid)
            const color = /^#[0-9A-F]{6}$/i.test(colorInput) ? colorInput : '#2B2D31';

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description.replace(/\\n/g, '\n')) // Allow manual newlines
                .setColor(color);

            if (image) {
                // Simple validation
                if (image.startsWith('http')) embed.setImage(image);
            }

            if (footer) embed.setFooter({ text: footer });

            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '✅ **Panel Created!**\nUse `/rolepanel add` to add role buttons to it.', ephemeral: true });
        }

        if (subcommand === 'add') {
            // Fetch last message from bot
            const messages = await interaction.channel.messages.fetch({ limit: 10 });
            const targetMsg = messages.find(m => m.author.id === interaction.client.user.id && m.embeds.length > 0);

            if (!targetMsg) {
                return interaction.reply({ content: '❌ No Role Panel (Bot Embed) found in the last 10 messages. Create one first with `/rolepanel create`.', ephemeral: true });
            }

            const role = interaction.options.getRole('role');
            const label = interaction.options.getString('label');
            const emoji = interaction.options.getString('emoji');
            const styleStr = interaction.options.getString('style') || 'Secondary';
            const style = ButtonStyle[styleStr];

            // Validate Role Position (Safety)
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ content: '❌ **Role too high!** I cannot assign a role higher than my own role.', ephemeral: true });
            }

            const customId = `role_toggle_${role.id}`;

            // Rebuild components
            let rows = targetMsg.components.map(row => ActionRowBuilder.from(row));

            // Create new button
            const newButton = new ButtonBuilder()
                .setCustomId(customId)
                .setLabel(label)
                .setStyle(style);

            if (emoji) newButton.setEmoji(emoji);

            // Add to rows
            if (rows.length === 0) {
                // New row
                rows.push(new ActionRowBuilder().addComponents(newButton));
            } else {
                // Try to fit in last row
                const lastRow = rows[rows.length - 1];
                if (lastRow.components.length < 5) {
                    lastRow.addComponents(newButton);
                } else {
                    // Last row full, create new one
                    if (rows.length >= 5) {
                        return interaction.reply({ content: '❌ **Panel Full!** Discord limits messages to 5 rows of buttons (25 roles). Please create a new panel.', ephemeral: true });
                    }
                    rows.push(new ActionRowBuilder().addComponents(newButton));
                }
            }

            await targetMsg.edit({ components: rows });
            return interaction.reply({ content: `✅ Added button for **${role.name}** to the panel!`, ephemeral: true });
        }
    } catch (error) {
        console.error('RolePanel Error:', error);
        return interaction.reply({
            content: `❌ **Terjadi Error:**\n\`${error.message}\``,
            ephemeral: true
        });
    }
}
