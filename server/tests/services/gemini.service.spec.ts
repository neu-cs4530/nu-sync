import { GoogleGenerativeAI } from '@google/generative-ai';
import generateHintGemini from '../../services/gemini.service';

jest.mock('@google/generative-ai', () => ({
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn(() => ({
                generateContent: jest.fn().mockResolvedValue({
                    response: {
                        text: jest.fn().mockReturnValue('This is a hint by the artist.'),
                    },
                }),
            })),
        })),
    }));

describe('generateHintGemini', () => {
    it('should return a hint string based on song and artist input', async () => {
        const song = 'One Dance';
        const artist = 'Drake';

        const result = await generateHintGemini(song, artist);

        expect(result).toBe('This is a hint by the artist.');
        expect(GoogleGenerativeAI).toHaveBeenCalledWith(expect.any(String));
    });
});
