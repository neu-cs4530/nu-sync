import Fuse from 'fuse.js';
import GameModel from '../../models/games.model';
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
    public constructor(username: string, accessToken: string, hint: string, songName: string, artistName: string) {

        const initialState: SpotifyGameState = {
            player: username,
            won: false,
            status: 'WAITING_TO_START',
            remainingGuesses: 3,
            hint,
            songName,
            artistName,
        };

        super(initialState, 'Spotify');
        this._answer = { songName, artistName };
    }

    /**
     * Applies a move (i.e., a guess) to the game.
     * @param move - The game move.
     */
    public async applyMove(move: GameMove<SpotifyMove>): Promise<void> {
        if (this.state.status !== 'IN_PROGRESS') {
            throw new Error('Game is not in progress');
        }

        const normalize = (str: string): string =>
            str.trim().toLowerCase().replace(/[^\w\s]/gi, '');

        const guess = normalize(move.move.guess);
        const correctAnswer = normalize(this._answer.songName);

        const fuse = new Fuse([correctAnswer], {
            includeScore: true,
            threshold: 0.3, 
        });

        const result = fuse.search(guess);
        const won = result.length > 0 && typeof result[0].score === 'number' && result[0].score <= 0.1;
        const remaining = this.state.remainingGuesses - 1;
        const newStatus = won || remaining === 0 ? 'OVER' : 'IN_PROGRESS';

        this.state = {
            ...this.state,
            won,
            remainingGuesses: remaining,
            status: won || remaining === 0 ? 'OVER' : 'IN_PROGRESS',
        };

        // delete game from db if over
        if (newStatus === 'OVER') {
            try {
                await GameModel.deleteOne({ gameID: this.id, gameType: 'Spotify' });
            } catch (err) {
                // handle error
            }
        }
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
    protected async _leave(playerID: string): Promise<void> {  
        if (playerID === this.state.player) {
            this.state = { ...this.state, status: 'OVER' };

            try {
                await GameModel.deleteOne({ gameID: this.id, gameType: 'Spotify' });
            } catch (err) {
                // handle error
            }
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
}

export default SpotifyGame;
