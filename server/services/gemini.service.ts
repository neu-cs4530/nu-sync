import { GoogleGenerativeAI } from '@google/generative-ai';

// function to generate a hint for Spotify music guessing game
const generateHint = async (song: string, artist: string): Promise<string> => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    console.log("GEMINI API KEY: ", genAI)

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
    Generate a hint for a music guessing game.
    Don't include the name of the song, but do include the name of the artist.
    Remove any special characters from the hint.
    Don't make it very hard to guess the song.
    Song: "${song}" by ${artist}.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

export default generateHint;