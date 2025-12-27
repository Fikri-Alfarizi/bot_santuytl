import { SlashCommandBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const data = new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Ngobrol santuy sama bot (Tanya apa aja!)')
    .addStringOption(option =>
        option.setName('pertanyaan')
            .setDescription('Tanya apa bro?')
            .setRequired(true));

export async function execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('pertanyaan');

    try {
        const prompt = `
        ROLE: Kamu adalah 'SantuyBot', teman ngobrol yang asik, gaul, dan pinter di server Discord ini.
        USER: ${interaction.user.username} bertanya: "${query}"
        
        INSTRUCTION:
        - Jawab dengan bahasa Indonesia gaul (lo/gue, anjay, bjir).
        - Jangan kaku, jangan formal. Anggap aja lagi chat sama temen tongkrongan.
        - Kalau pertanyaannya teknis/coding, kasih jawaban yang bener dan helpful tapi tetep santuy.
        - Kalau pertanyaannya aneh/becanda, timpalin balik dengan lucu atau sarkas dikit.
        - Pendek aja, jangan bikin cerpen, kecuali emang perlu penjelasan panjang.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Discord limit 2000 chars
        if (response.length > 1900) {
            await interaction.editReply(response.substring(0, 1900) + '... (kepanjangan bjir)');
        } else {
            await interaction.editReply(response);
        }

    } catch (error) {
        console.error(error);
        await interaction.editReply('Waduh, otak gue lagi error nih. Coba tanya lagi nanti yak! 🤕');
    }
}
