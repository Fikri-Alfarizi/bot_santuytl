import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from 'discord.js';

const wyrQuestions = [
    "Pilih mana: Bisa terbang tapi cuma setinggi 1 meter, atau bisa teleportasi tapi cooldown 10 jam?",
    "Pilih mana: Selalu tahu kalau ada orang bohong, atau selalu tahu kalau ada orang naksir kamu?",
    "Pilih mana: Hidup tanpa musik, atau hidup tanpa internet (selain untuk kerja)?",
    "Pilih mana: Punya uang tak terbatas tapi sendirian, atau hidup pas-pasan bareng teman-teman terbaik?",
    "Pilih mana: Makan nasi goreng tiap hari seumur hidup, atau makan mie instan tiap hari seumur hidup?",
    "Pilih mana: Terjebak di pulau terpencil sama mantan, atau sama musuh bebuyutan?",
    "Pilih mana: Bisa ngomong sama hewan, atau bisa ngomong semua bahasa manusia?",
    "Pilih mana: Jadi orang terpintar di dunia tapi jelek, atau jadi orang terbodoh tapi paling cakep?",
    "Pilih mana: Gak pernah kena macet lagi, atau gak pernah kehabisan baterai HP lagi?",
    "Pilih mana: Makan makanan yang rasanya kayak sampah tapi sehat, atau makan sampah yang rasanya enak banget?"
];

export const data = new SlashCommandBuilder()
    .setName('wyr')
    .setDescription('Mending Mana? Main tebak-tebakan pilihan sulit');

export async function execute(interaction) {
    const randomQuestion = wyrQuestions[Math.floor(Math.random() * wyrQuestions.length)];
    const [choiceA, choiceB] = randomQuestion.replace('Pilih mana: ', '').split(', atau ');

    const embed = {
        title: '🤔 **MENDING MANA? (WOULD YOU RATHER)**',
        description: `**Pilihan A:** ${choiceA}\n\n*ATAU*\n\n**Pilihan B:** ${choiceB}`,
        color: 0xFFA500, // Orange
        footer: { text: 'Klik tombol di bawah untuk voting!' }
    };

    const btnA = new ButtonBuilder()
        .setCustomId('wyr_a')
        .setLabel('Pilihan A')
        .setStyle(ButtonStyle.Primary);

    const btnB = new ButtonBuilder()
        .setCustomId('wyr_b')
        .setLabel('Pilihan B')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(btnA, btnB);

    const sent = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    // Collect votes (Demo: just reply interaction)
    const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    const votes = { a: 0, b: 0 };

    collector.on('collect', async i => {
        if (i.customId === 'wyr_a') votes.a++;
        if (i.customId === 'wyr_b') votes.b++;

        await i.reply({ content: `✅ Kamu memilih **${i.customId === 'wyr_a' ? 'Pilihan A' : 'Pilihan B'}**!`, ephemeral: true });
    });

    collector.on('end', () => {
        sent.edit({
            embeds: [embed],
            components: [], // Remove buttons
            content: `📊 **HASIL VOTING:**\n**A:** ${votes.a} Suara\n**B:** ${votes.b} Suara`
        });
    });
}
