import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Spotify game state.
 *
 * This schema defines the structure of the game state specific to the Nim game. It includes the following fields:
 * - `player`: The username of the first player.
 * - `won`: Boolean value indicating if the player has won the game.
 * - `status`: The current game status, which can be one of the following values:
 *    - `'IN_PROGRESS'`: The game is ongoing.
 *    - `'WAITING_TO_START'`: The game is waiting to start.
 *    - `'OVER'`: The game is finished.
 * - `remainingGuesses`: The number of remaining guesses in the game.
 */
const SpotifyGameStateSchema = new Schema({
    player: { type: String },
    won: {type: Boolean},
    status: { type: String, enum: ['IN_PROGRESS', 'WAITING_TO_START', 'OVER'], required: true },
    remainingGuesses: { type: Number },
    hint: { type: String },
});

const SpotifySchema = new Schema({
    state: { type: SpotifyGameStateSchema, required: true },
});

export default SpotifySchema;