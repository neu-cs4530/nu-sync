import api from './config';

const SPOTIFY_API_URL = `${process.env.REACT_APP_SERVER_URL}/spotify`;

/**
 * Initiates the Spotify login flow by redirecting the browser to the backend Spotify auth endpoint.
 * This will kick off the OAuth process with Spotify.
 * @throws This function does not throw but initiates a page redirect.
 */
const loginSpotify = async () => {
  // we use this because axios does not automatically allow for redirects
  window.location.href = `${SPOTIFY_API_URL}/auth/spotify`;
};

/**
 * Fetches the user's Spotify playlists from the backend using their stored access token.
 * @param username The username of the user for whom to fetch playlists.
 * @returns A list of Spotify playlists from the backend.
 * @throws Error if the request fails or the user is unauthorized.
 */
export const getSpotifyPlaylists = async (username: string) => {
  const accessToken = localStorage.getItem('spotify_access_token');
  const res = await api.post(`${SPOTIFY_API_URL}/getPlaylists`, {
    access_token: accessToken,
    username,
  });

  return res.data;
};

/**
 * Retrieves the list of tracks in a specific Spotify playlist.
 * @param playlistId The ID of the Spotify playlist to fetch tracks from.
 * @returns An array of tracks in the playlist.
 * @throws Error if the request fails or the playlist cannot be found.
 */
export const getPlaylistTracks = async (playlistId: string, market = 'US') => {
  const accessToken = localStorage.getItem('spotify_access_token');
  if (!accessToken) {
    throw new Error('Missing access token. Please reconnect to Spotify.');
  }

  const res = await api.get(`${SPOTIFY_API_URL}/getPlaylistTracks`, {
    params: {
      playlistId,
      access_token: accessToken,
    },
  });


  return res.data.tracks;
};

/**
 * Fetches the currently playing track on the user's Spotify account.
 * @returns The currently playing track data or a flag indicating nothing is playing.
 * @throws Error if the request fails.
 */
export const getCurrentlyPlaying = async (username: string) => {
  const res = await api.get(`${SPOTIFY_API_URL}/current-track`, {
    params: { username },
  });
  return res.data;
};


/**
 * Checks if the user is connected to Spotify and whether something is currently playing.
 * @param username The username of the user to check Spotify status for.
 * @returns An object indicating whether Spotify is connected and if something is currently playing.
 * @throws Error if the request fails or the user does not exist.
 */
export const checkSpotifyStatus = async (username: string) => {
  const res = await api.get(`${SPOTIFY_API_URL}/isConnected`, {
    params: { username },
  });
  return res.data; // { isConnected, currentlyPlaying }
};

export default loginSpotify;