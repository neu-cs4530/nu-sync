import { GameMove, SpotifyMove, SpotifyGameState } from '../../types/types';
import Game from './game';

/**
 * Represents a Spotify guessing game, extending the generic Game class.
 */
class SpotifyGame extends Game<SpotifyGameState, SpotifyMove> {
    private _answer: { songName: string; artistName: string };

    /**
     * Constructs a SpotifyGame instance with initial game state.
     * @param username - The player's username.
     * @param accessToken - The player's Spotify access token.
     */
    public constructor(username: string, accessToken: string) {
        const mockSong = SpotifyGame._getMockSong();

        const initialState: SpotifyGameState = {
            player: username,
            won: false,
            status: 'WAITING_TO_START',
            remainingGuesses: 3,
            hint: SpotifyGame._generateMockHint(mockSong.songName, mockSong.artistName),
            songName: mockSong.songName,
            artistName: mockSong.artistName,
        };

        super(initialState, 'Spotify');
        this._answer = mockSong;
    }

    /**
     * Applies a move (i.e., a guess) to the game.
     * @param move - The game move.
     */
    public applyMove(move: GameMove<SpotifyMove>): void {
        if (this.state.status !== 'IN_PROGRESS') {
            throw new Error('Game is not in progress');
        }

        const guess = move.move.guess.toLowerCase();
        const correctAnswer = this._answer.songName.toLowerCase();

        const remaining = this.state.remainingGuesses - 1;
        const won = guess === correctAnswer;

        this.state = {
            ...this.state,
            won,
            remainingGuesses: remaining,
            status: won || remaining === 0 ? 'OVER' : 'IN_PROGRESS',
        };
    }

    /**
     * Starts the game when a player joins.
     * @param playerID - The ID of the joining player.
     */
    protected _join(playerID: string): void {
        if (this._players.length === 0 && playerID === this.state.player) {
            this.state = { ...this.state, status: 'IN_PROGRESS' };
        } else {
            throw new Error('Invalid join attempt or player already joined');
        }
    }

    /**
     * Handles when a player leaves the game.
     * @param playerID - The ID of the leaving player.
     */
    protected _leave(playerID: string): void {
        if (playerID === this.state.player) {
            this.state = { ...this.state, status: 'OVER' };
        } else {
            throw new Error('Cannot leave game: player not in game');
        }
    }

    /**
     * Converts the current game into a model suitable for DB saving.
     */
    public toModel() {
        return {
            gameID: this.id,
            players: this._players,
            gameType: this.gameType,
            state: this.state,
        };
    }

    /**
     * Mock song generator for now. TODO: Replace this with real Spotify API logic later.
     */
    private static _getMockSong(): { songName: string; artistName: string } {
        return {
            songName: 'Blinding Lights',
            artistName: 'The Weeknd',
        };
    }

    /**
     * Mock hint generator. TODO: Replace with Gemini API integration later.
     */
    private static _generateMockHint(song: string, artist: string): string {
        return `This hit by ${artist} dominated the charts and has a retro 80s vibe.`;
    }
}

export default SpotifyGame;
