import axios from 'axios';

// function to generate a hint for Spotify music guessing game using Perplexity API
const generateHintPerplexity = async (song: string, artist: string): Promise<string> => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
        throw new Error('Perplexity API key is missing');
    }

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

    try {
        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar', 
                stream: false,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        const reply = response.data.choices?.[0]?.message?.content;
        if (!reply) {
            throw new Error('No hint returned from Perplexity API');
        }

        const cleaned = reply.trim().replace(/^"(.*)"$/, '$1');

        return cleaned;
    } catch (error) {
        throw new Error('Failed to generate hint using Perplexity');
    }
};

export default generateHintPerplexity;