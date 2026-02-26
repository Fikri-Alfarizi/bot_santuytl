import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateDailyTopic() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found!');
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Buatkan satu pertanyaan atau ajakan singkat untuk meminta member berbagi masalah teknis mereka (error game, crash, installation issues, DirectX problems, dll). Gunakan bahasa Indonesia yang ramah dan casual. Maksimal 2 kalimat, tidak panjang."

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating AI topic:', error.message);
        return null;
    }
}
