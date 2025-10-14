import axios from 'axios';
import generateHintPerplexity from '../../services/perplexity.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('generateHintPerplexity', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv, PERPLEXITY_API_KEY: 'fake-api-key' };
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    it('should return a cleaned hint when API responds correctly', async () => {
        const mockHint = '"This is a fun hint about the artist."';
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                choices: [
                    {
                        message: {
                            content: mockHint,
                        },
                    },
                ],
            },
        });

        const result = await generateHintPerplexity('One Dance', 'Drake');

        expect(result).toBe('This is a fun hint about the artist.');
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.perplexity.ai/chat/completions',
            expect.any(Object),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Bearer fake-api-key`,
                }),
            }),
        );
    });

    it('should throw if PERPLEXITY_API_KEY is missing', async () => {
        delete process.env.PERPLEXITY_API_KEY;

        await expect(generateHintPerplexity('One Dance', 'Drake')).rejects.toThrow(
            'Perplexity API key is missing'
        );
    });

    it('should throw if no content is returned in response', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { choices: [] } });

        await expect(generateHintPerplexity('One Dance', 'Drake')).rejects.toThrow(
            'Failed to generate hint using Perplexity'
        );
    });

    it('should throw if axios call fails', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('API down'));

        await expect(generateHintPerplexity('One Dance', 'Drake')).rejects.toThrow(
            'Failed to generate hint using Perplexity'
        );
    });
});
