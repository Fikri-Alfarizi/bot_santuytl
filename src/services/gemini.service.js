import { GoogleGenerativeAI } from '@google/generative-ai';

let model = null;

const initializeGemini = () => {
    if (!model) {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('❌ GOOGLE_API_KEY or GEMINI_API_KEY is missing!');
            return null;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-pro" });
    }
    return model;
};

export const askGemini = async (username, query, history = []) => {
    try {
        const aiModel = initializeGemini();
        if (!aiModel) return "Waduh, API Key gue ilang bro. Bilang admin suruh benerin env variable yak!";

        // Construct Prompt with Persona
        const prompt = `
        ROLE: Kamu adalah 'SantuyBot', teman ngobrol yang asik, gaul, dan pinter di server Discord ini.
        USER: ${username} bertanya: "${query}"
        
        INSTRUCTION:
        - Jawab dengan bahasa Indonesia gaul (lo/gue, anjay, bjir).
        - Jangan kaku, jangan formal. Anggap aja lagi chat sama temen tongkrongan.
        - Kalau pertanyaannya teknis/coding, kasih jawaban yang bener dan helpful tapi tetep santuy.
        - Kalau pertanyaannya aneh/becanda, timpalin balik dengan lucu atau sarkas dikit.
        - Pendek aja, jangan bikin cerpen, kecuali emang perlu penjelasan panjang.
        - JANGAN pakai format [Role]: [Message]. Langsung jawab aja.
        `;

        // Note: For now we just send the prompt. 
        // Real multi-turn chat would require maintaining a chatSession object, 
        // but for simple replies, one-shot prompt with context is easier for now.

        const result = await aiModel.generateContent(prompt);
        const response = result.response.text();
        return response;

    } catch (error) {
        console.error('Gemini Error:', error);
        return "Aduh, otak gue lagi korslet. Coba bendtar lagi yak! 🤕";
    }
};
