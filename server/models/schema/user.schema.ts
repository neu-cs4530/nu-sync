import { Schema } from 'mongoose';

/**
 * Mongoose schema for the User collection.
 *
 * This schema defines the structure for storing users in the database.
 * Each User includes the following fields:
 * - `username`: The username of the user.
 * - `password`: The encrypted password securing the user's account.
 * - `dateJoined`: The date the user joined the platform.
 * - `biography`: A bio of the user.
 * - `friends`: An array of usernames representing friends of the user.
 * - `spotifyId`: The Spotify user ID for integration with Spotify.
 * - `spotifyAccessToken`: The Spotify access token for integration with Spotify.
 * - `spotifyRefreshToken`: The Spotify refresh token for integration with Spotify.
 * - `musicPreferences`: Stores the user's favorite genres, artists, and tracks.
 * - `privacySettings`: Controls the visibility of the user's profile and music history.
 * - `playlists`: Stores user-created playlists.
 * - `currentlyPlaying`: The currently playing track on Spotify.
 * - `playlistHistory`: The history of playlists the user has interacted with.
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
    friends: {
      type: [String],
      default: [],
    },
    spotifyId: {
      type: String,
      sparse: true, // Allows for null values without violating uniqueness
    },
    spotifyAccessToken: {
      type: String,
      default: null,
    },
    spotifyConflictTemp: {
      type: Boolean,
      default: false,
    },
    spotifyConflictUserId: {
      type: String,
      default: null,
    },
    spotifyRefreshToken: {
      type: String,
      default: null,
    },
    musicPreferences: {
      type: [String],
      default: [],
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
      },
    },
    playlists: {
      type: [
        {
          playlistId: String,
          playlistName: String,
          tracks: [
            {
              trackId: String,
              trackName: String,
              artistName: String,
              albumName: String,
            },
          ],
        },
      ],
      default: [],
    },
    currentlyPlaying: {
      type: {
        trackId: String,
        trackName: String,
        artistName: String,
        albumName: String,
        progressMs: Number,
      },
      default: null,
    },
    playlistHistory: {
      type: [
        {
          playlistId: String,
          playlistName: String,
          lastPlayed: Date,
        },
      ],
      default: [],
    },
    onlineStatus: {
      status: {
        type: String,
        enum: ['online', 'away', 'busy', 'invisible'],
        default: 'online',
      },
      busySettings: {
        type: {
          muteScope: {
            type: String,
            enum: ['friends-only', 'everyone'],
            default: 'everyone',
          },
        },
        default: undefined,
      },
    },
    quietHours: {
      type: {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
      required: false,
      default: undefined,
    },
    oldStatus: {
      type: {
        status: { type: String, enum: ['online', 'away', 'busy', 'invisible'] },
        busySettings: {
          type: {
            muteScope: { type: String, enum: ['friends-only', 'everyone'] },
          },
        },
      },
    },
  },
  { collection: 'User' },
);

export default userSchema;
