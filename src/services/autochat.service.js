import { GoogleGenerativeAI } from '@google/generative-ai';
import guildService from '../services/guild.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function runAutoChat(client, timeLabel) {
    console.log(`[AUTO-CHAT] Running for schedule: ${timeLabel}`);

    const guilds = client.guilds.cache.map(g => g.id);

    for (const guildId of guilds) {
        const settings = guildService.getSettings(guildId);

        if (!settings || !settings.general_chat_channel_id) continue;

        try {
            const channel = await client.channels.fetch(settings.general_chat_channel_id);
            if (!channel || !channel.isTextBased()) continue;

            // 1. Fetch History chat buat konteks
            const messages = await channel.messages.fetch({ limit: 15 });
            const chatHistory = messages.reverse().map(m => {
                return `${m.author.username}: ${m.content}`;
            }).join('\n');

            // 2. Generate Prompt
            const prompt = `
            Context: Kamu adalah member discord yang asik, santuy, sedikit tengil tapi friendly bernama 'SantuyBot'. 
            Sekarang jam: ${timeLabel}.
            
            Ini obrolan terakhir di server:
            """
            ${chatHistory}
            """
            
            Tugasmu: 
            Komentari topik yang lagi dibahas terakhir kali ATAU jika sepi, buka topik baru yang relevan dengan jam segini (${timeLabel}).
            Pake bahasa gaul Indonesia (lo/gue, anjay, wkwk), jangan kaku kayak robot. Pura-pura aja kamu manusia yang lagi gabut.
            Maksimal 2 kalimat. Jangan pakai tanda kutip.
            `;

            // 3. Call Gemini
            const result = await model.generateContent(prompt);
            const response = result.response.text();

            // 4. Send Message
            if (response) {
                await channel.sendTyping();
                setTimeout(async () => {
                    await channel.send(response);
                }, 3000); // Delay typing effect
            }

        } catch (error) {
            console.error(`[AUTO-CHAT ERROR] Guild ${guildId}:`, error.message);
        }
    }
}
