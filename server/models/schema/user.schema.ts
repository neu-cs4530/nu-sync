import { Schema } from 'mongoose';

/**
 * Mongoose schema for the User collection.
 *
 * This schema defines the structure for storing users in the database.
 * Each User includes the following fields:
 * - `username`: The username of the user.
 * - `password`: The encrypted password securing the user's account.
 * - `dateJoined`: The date the user joined the platform.
 * - `biography`: A short description about the user.
 * - `spotifyId`: The Spotify user ID for integration with Spotify.
 * - `musicPreferences`: Stores the user's favorite genres, artists, and tracks.
 * - `privacySettings`: Controls the visibility of the user's profile and music history.
 * - `playlists`: Stores user-created playlists.
 * 
 */
const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      immutable: true,
    },
    password: {
      type: String,
    },
    dateJoined: {
      type: Date,
    },
    biography: {
      type: String,
      default: '',
    },
  },
  { collection: 'User' },
);

export default userSchema;
