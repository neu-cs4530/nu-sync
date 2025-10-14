import { Model } from 'mongoose';
import { GameInstance, SpotifyGameState } from '../types/types';
import GameModel from './games.model';
import spotifySchema from './schema/spotify.schema';

/**
 * Mongoose model for the `Spotify` game, extending the `Game` model using a discriminator.
 *
 * This model adds specific fields from the `spotifySchema` to the `Game` collection, enabling operations
 * specific to the `Spotify` game type while sharing the same collection.
 */
const SpotifyModel: Model<GameInstance<SpotifyGameState>> = GameModel.discriminator('Spotify', spotifySchema);

export default SpotifyModel;