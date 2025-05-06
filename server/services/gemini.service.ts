import { GoogleGenerativeAI } from '@google/generative-ai';

// function to generate a hint for Spotify music guessing game using Gemini API
const generateHintGemini = async (song: string, artist: string): Promise<string> => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
    Generate a fun, concise hint for a music guessing game. Do not be verbose and maximum 2 sentences.
    Get all the information about the song from Genius and use the description, lyrics, and facts about the song.
    DO NOT include the name of the song, but mention the artist. Don't use overly verbose words.
    Avoid special characters. Keep it easy to guess.
    Don't make it too wordy.

    Example Song 1: Deep End - SIDEPIECE Remix by John Summit 
    Example Response 1: This is a song by John Summit that's one of his most popular songs. It's remixed by SIDEPIECE and it's a super popular bouncy house song.

    Example Song 2: One Dance by Drake ft. Wizkid & Kyla
    Example Response 2: This is a song by Drake that follows a dancehall beat. It's a popular song and was a number one hit.

    Song: "${song}" by ${artist}.
    Resposne:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

export default generateHintGemini;