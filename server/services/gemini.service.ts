import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// function to generate a hint for Spotify music guessing game
const generateHint = async (song: string, artist: string): Promise<string> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    Generate a short and clever hint for a music guessing game.
    Don't include the name of the song or artist directly.
    Song: "${song}" by ${artist}.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

export default generateHint;