import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

// Import commands for Auto-Run (Only safe/simple ones)
import * as daily from './daily.js';
import * as ping from './ping.js';
import * as work from './work.js';
import * as balance from './profile.js'; // Assuming profile shows balance
import * as checkIn from './rep.js';

const COMMAND_DATA = {
    economy: {
        emoji: '💸',
        label: 'Economy',
        description: 'Cari cuan, belanja, dan jadi sultan.',
        commands: [
            { name: 'daily', desc: 'Ambil gaji harian', autoRun: true, module: daily },
            { name: 'work', desc: 'Kerja rodil', autoRun: true, module: work },
            { name: 'profile', desc: 'Cek saldo & stats', autoRun: true, module: balance },
            { name: 'shop', desc: 'Buka Santuy Mart', autoRun: false, guide: 'Gunakan `/shop` untuk buka menu belanja.' },
            { name: 'send', desc: 'Kirim duit ke teman', autoRun: false, guide: 'Gunakan `/send <user> <amount>`' }
        ]
    },
    fun: {
        emoji: '🎢',
        label: 'Fun & Games',
        description: 'Gacha, spin, dan seru-seruan.',
        commands: [
            { name: 'spin', desc: 'Putar slot machine', autoRun: false, guide: 'Gunakan `/spin` untuk main gratis/premium.' },
            { name: 'meme', desc: 'Kirim meme random', autoRun: false, guide: 'Gunakan `/meme`' },
            { name: 'quote', desc: 'Kata-kata bijak', autoRun: false, guide: 'Gunakan `/quote`' }
        ]
    },
    system: {
        emoji: '🛡️',
        label: 'System',
        description: 'Ping, Stats, dan Info.',
        commands: [
            { name: 'ping', desc: 'Cek latency bot', autoRun: true, module: ping },
            { name: 'help', desc: 'Buka menu ini', autoRun: true }, // Recursion? Nah just reset
            { name: 'season', desc: 'Cek info season', autoRun: false, guide: 'Gunakan `/season` untuk info rank.' }
        ]
    }
};

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Buka Dashboard Pusat Bantuan SantuyTL');

export async function execute(interaction) {
    await showHome(interaction);
}

// 1. Home Screen
async function showHome(interaction, isUpdate = false) {
    const embed = {
        title: '📘 **SANTUY TL DASHBOARD**',
        description: 'Selamat datang di pusat kontrol SantuyTL.\nPilih kategori di bawah untuk melihat fitur atau **jalankan command langsung**!',
        color: 0x5865F2,
        thumbnail: { url: interaction.client.user.displayAvatarURL() },
        image: { url: 'https://media.giphy.com/media/l41Ykfi2uGJHkBSfu/giphy.gif' }, // Futuristic HUD GIF
        fields: [
            { name: '📊 Stats', value: `Server: ${interaction.guild.name}\nPing: ${interaction.client.ws.ping}ms`, inline: true },
            { name: '🤖 Version', value: 'v2.0 (Agentic)', inline: true }
        ],
        footer: { text: 'Pilih kategori 👇' }
    };

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('Pilih Kategori Fitur...')
        .addOptions(
            Object.entries(COMMAND_DATA).map(([key, data]) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(data.label)
                    .setDescription(data.description)
                    .setValue(key)
                    .setEmoji(data.emoji)
            )
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const payload = { embeds: [embed], components: [row], ephemeral: true };

    let response;
    if (isUpdate) {
        response = await interaction.update(payload);
    } else {
        response = await interaction.reply(payload);
    }

    // Collector for Categories
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'help_category_select') {
            await showCategory(i, i.values[0]);
        }
    });
}

// 2. Category Screen
async function showCategory(interaction, categoryKey) {
    const data = COMMAND_DATA[categoryKey];

    // Command Dropdown
    const commandOptions = data.commands.map(cmd =>
        new StringSelectMenuOptionBuilder()
            .setLabel(`/${cmd.name}`)
            .setDescription(cmd.desc)
            .setValue(`cmd_${cmd.name}`)
            .setEmoji(cmd.autoRun ? '⚡' : '📖')
    );

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`help_cmd_select_${categoryKey}`)
        .setPlaceholder(`Pilih Command di ${data.label}...`)
        .addOptions(commandOptions);

    const backButton = new ButtonBuilder()
        .setCustomId('help_home')
        .setLabel('Kembali ke Home')
        .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents(selectMenu);
    const row2 = new ActionRowBuilder().addComponents(backButton);

    const embed = {
        title: `${data.emoji} **KATEGORI: ${data.label.toUpperCase()}**`,
        description: data.description + '\n\n**Daftar Command:**',
        color: 0x00A8FF,
        fields: data.commands.map(cmd => ({
            name: `/${cmd.name}`,
            value: `${cmd.autoRun ? '⚡ **Auto-Run**' : '📖 **Manual**'} - ${cmd.desc}`,
            inline: false
        }))
    };

    await interaction.update({ embeds: [embed], components: [row1, row2] });

    // Sub-Collector
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'help_home') {
            await showHome(i, true);
            return;
        }

        if (i.isStringSelectMenu() && i.values[0].startsWith('cmd_')) {
            const cmdName = i.values[0].replace('cmd_', '');
            const cmdData = data.commands.find(c => c.name === cmdName);
            await handleCommandSelection(i, cmdData);
        }
    });
}

// 3. Command Action (Auto-Run or Guide)
async function handleCommandSelection(interaction, cmdData) {
    if (cmdData.autoRun && cmdData.module) {
        // AUTO RUN LOGIC
        // We need to fake the interaction for the module
        // Since we are inside an update, we can't reply again easily if the module uses reply()
        // Strategy: Defer update -> Send FollowUp -> Call module with FollowUp context

        await interaction.update({
            content: `⚡ **Menjalankan /${cmdData.name}...**`,
            embeds: [],
            components: []
        });

        try {
            // Mock Interaction to force followUp instead of reply
            const mockInteraction = Object.create(interaction);
            mockInteraction.reply = interaction.followUp.bind(interaction);
            mockInteraction.deferReply = async () => { }; // No-op if they defer
            mockInteraction.editReply = interaction.editReply.bind(interaction);

            await cmdData.module.execute(mockInteraction);
        } catch (e) {
            console.error(e);
            await interaction.followUp({ content: '❌ Gagal menjalankan otomatis. Coba ketik manual aja ya.', ephemeral: true });
        }

    } else {
        // GUIDE LOGIC
        const embed = {
            title: `📖 **PANDUAN: /${cmdData.name}**`,
            description: cmdData.guide || 'Command ini tidak bisa dijalankan otomatis.',
            color: 0xFFFF00,
            fields: [
                { name: 'Deskripsi', value: cmdData.desc }
            ]
        };

        const backButton = new ButtonBuilder()
            .setCustomId('help_home_from_guide')
            .setLabel('Kembali ke Menu')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(backButton);

        await interaction.update({ embeds: [embed], components: [row] });

        const msg = await interaction.fetchReply();
        const btnCol = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });
        btnCol.on('collect', async i => {
            if (i.customId === 'help_home_from_guide') await showHome(i, true);
        });
    }
}
