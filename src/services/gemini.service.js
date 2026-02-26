import axios from 'axios';

export const askGemini = async (username, query, history = []) => {
    try {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) return "Waduh, API Key gue ilang bro. Bilang admin suruh benerin env variable yak! (Missing API Key)";

        // Use v1beta API
        // Try 'gemini-1.5-flash' first. If this fails, we might need 'gemini-1.5-flash-latest'
        const MODEL = "gemini-2.5-flash";

        // Use standard URL construction
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

        const prompt = `
        ROLE: Kamu adalah 'SantuyBot', asisten teknis yang ramah dan helpful di server Discord ini.
        USER: ${username} bertanya: "${query}"
        
        INSTRUCTION:
        - FOCUS HANYA pada BANTUAN ERROR & MASALAH TEKNIS:
          * DirectX errors, graphics issues
          * Game crash, force close, won't launch, won't install
          * Game compatibility, performance problems
          * Software installation errors
          * Troubleshooting untuk masalah teknis gaming
        
        - UNTUK CRASH/FORCE CLOSE ERROR: WAJIB kasih minimal 1-2 quick fix suggestions:
          * Clear cache/reinstall
          * Update drivers (GPU/DirectX)
          * Check game requirements
          * Close background apps
          * Tanya: "Game apa? PC atau HP? Ada error message?"
        
        - REJECT pertanyaan non-teknis dengan ramah (ngobrol santai, jokes, topik random)
        - Jawab dengan bahasa Indonesia yang ramah dan gaul (lo/gue) tapi profesional
        - Berikan penjelasan lengkap dan solusi detail sesuai kebutuhan (TIDAK perlu pendek)
        - Beri solusi praktis dan langsung kena sasaran
        - JANGAN pakai format [Role]: [Message]. Langsung jawab aja.
        - Kalau gak bisa bantu karena bukan error teknis, bilang ramah "Waduh, itu diluar keahlian gue bro. Tanya orang lain ya!"
        `;

        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7
            }
        };

        const response = await axios.post(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            timeout: 10000
        });

        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            const reply = response.data.candidates[0].content.parts[0].text;
            return reply;
        }

        return "Gemini diam seribu bahasa... (No candidates returned)";

    } catch (error) {
        console.error('⚠️ Gemini API Error:', error.response ? error.response.data : error.message);

        const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        const statusCode = error.response?.status;

        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            return "Waduh, kebanyakan mikir nih gue (Quota Limit). Tunggu bentar yak! ⏳";
        }
        if (errMsg.includes('SAFETY')) {
            return "Eits, pertanyaan lu terlalu bahaya buat gue jawab wkwk. Skip ah! 🚫";
        }
        if (errMsg.includes('404')) {
            return "Modelnya gak ketemu bro (404). Mungkin salah versi API. 🤕";
        }
        if (statusCode === 503 || errMsg.includes('503') || errMsg.includes('Service Unavailable')) {
            return "Server Gemini lagi sibuk banget bro. Coba lagi nanti ya! 🔄";
        }
        if (statusCode >= 500 || errMsg.includes('500') || errMsg.includes('502')) {
            return "Gemini server lagi maintenance. Sabar sebentar yak! 🔧";
        }

        return `Aduh, otak gue lagi korslet. Error: ${error.message} 🤕`;
    }
};
