import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('wyr')
    .setDescription('Would You Rather? (Pilih Mana?)');

const wyrQuestions = [
    "Pilih mana: Bisa terbang tapi cuma setinggi 1 meter, atau bisa teleportasi tapi cooldown 10 jam?",
    "Pilih mana: Selalu tahu kalau ada orang bohong, atau selalu tahu kalau ada orang naksir kamu?",
    "Pilih mana: Hidup tanpa musik, atau hidup tanpa internet (selain untuk kerja)?",
    "Pilih mana: Punya uang tak terbatas tapi sendirian, atau hidup pas-pasan bareng teman-teman terbaik?",
    "Pilih mana: Makan nasi goreng tiap hari seumur hidup, atau makan mie instan tiap hari seumur hidup?"
];

export async function execute(interaction) {
    const randomQuestion = wyrQuestions[Math.floor(Math.random() * wyrQuestions.length)];

    const embed = {
        title: '🤔 WOULD YOU RATHER?',
        description: randomQuestion,
        color: 0xFFA500,
        footer: { text: '/wyr to play again' }
    };

    await interaction.reply({ embeds: [embed] });
}
