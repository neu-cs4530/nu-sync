import GameModel from '../../../models/games.model';
import SpotifyGame from '../../../services/games/spotify';
import { GameMove, SpotifyMove, SpotifyGameState, GameInstance } from '../../../types/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

describe('SpotifyGame tests', () => {
    let game: SpotifyGame;

    const defaultData = {
        username: 'testuser',
        accessToken: 'fake_token',
        hint: 'Guess this song!',
        songName: 'One Dance',
        artistName: 'Drake',
    };

    beforeEach(() => {
        game = new SpotifyGame(
            defaultData.username,
            defaultData.accessToken,
            defaultData.hint,
            defaultData.songName,
            defaultData.artistName
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        mockingoose.resetAll();
    });

    describe('constructor', () => {
        it('initializes with correct state and properties', () => {
            expect(game.id).toBeDefined();
            expect(game.gameType).toBe('Spotify');
            expect(game.toModel().state.status).toBe('WAITING_TO_START');
            expect(game.toModel().state.remainingGuesses).toBe(3);
        });
    });

    describe('toModel', () => {
        it('returns the current game state and metadata', () => {
            const model: GameInstance<SpotifyGameState> = game.toModel();
            expect(model.gameType).toBe('Spotify');
            expect(model.state.hint).toBe(defaultData.hint);
            expect(model.state.songName).toBe(defaultData.songName);
            expect(model.state.artistName).toBe(defaultData.artistName);
        });
    });

    describe('join', () => {
        it('should transition game to IN_PROGRESS when the right player joins', () => {
            game.join(defaultData.username);
            expect(game.toModel().state.status).toBe('IN_PROGRESS');
        });

        it('should throw error for invalid join', () => {
            expect(() => game.join('wronguser')).toThrow('Invalid join attempt or player already joined');
        });
    });

    describe('leave', () => {
        it('should mark game as OVER and delete from DB on leave', async () => {
            game.join(defaultData.username);
            mockingoose(GameModel).toReturn({}, 'deleteOne');

            await game.leave(defaultData.username);

            const state = game.toModel().state;
            expect(state.status).toBe('OVER');
        });

        it('should handle DB deletion error gracefully when player leaves', async () => {
            game.join(defaultData.username);
            const spy = jest
                .spyOn(GameModel, 'deleteOne')
                .mockImplementationOnce(() =>
                ({
                    exec: () => Promise.reject(new Error('DB error')),
                } as any)
                );

            await game.leave(defaultData.username);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith({ gameID: game.id, gameType: 'Spotify' });

            const state = game.toModel().state;
            expect(state.status).toBe('OVER');
        });

    });

    describe('applyMove', () => {
        beforeEach(() => {
            game.join(defaultData.username);
        });

        it('should mark game as won if guess is close enough', async () => {
            const move: GameMove<SpotifyMove> = {
                playerID: defaultData.username,
                gameID: game.id,
                move: { guess: 'one dance' },
            };

            mockingoose(GameModel).toReturn({}, 'deleteOne');
            await game.applyMove(move);

            expect(game.toModel().state.won).toBe(true);
            expect(game.toModel().state.status).toBe('OVER');
        });

        it('should decrease remainingGuesses and continue game if guess is incorrect', async () => {
            const move: GameMove<SpotifyMove> = {
                playerID: defaultData.username,
                gameID: game.id,
                move: { guess: 'bad guess' },
            };

            await game.applyMove(move);
            expect(game.toModel().state.remainingGuesses).toBe(2);
            expect(game.toModel().state.status).toBe('IN_PROGRESS');
        });

        it('should end game if 3 wrong guesses are made', async () => {
            const move: GameMove<SpotifyMove> = {
                playerID: defaultData.username,
                gameID: game.id,
                move: { guess: 'bad guess' },
            };

            await game.applyMove(move);
            await game.applyMove(move);
            mockingoose(GameModel).toReturn({}, 'deleteOne');
            await game.applyMove(move);

            expect(game.toModel().state.status).toBe('OVER');
            expect(game.toModel().state.won).toBe(false);
        });

        it('should throw if game is not in progress', async () => {
            const move: GameMove<SpotifyMove> = {
                playerID: defaultData.username,
                gameID: game.id,
                move: { guess: 'anything' },
            };

            // Simulate not joining the game
            const newGame = new SpotifyGame(
                defaultData.username,
                defaultData.accessToken,
                defaultData.hint,
                defaultData.songName,
                defaultData.artistName
            );

            await expect(newGame.applyMove(move)).rejects.toThrow('Game is not in progress');
        });
    });
});
