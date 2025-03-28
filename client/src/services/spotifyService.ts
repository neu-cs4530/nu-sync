const SPOTIFY_API_URL = `${process.env.REACT_APP_SERVER_URL}/spotify` ;
import api from './config';

/**
 * Function to login with spotify
 *
 * @throws Error if there is an issue fetching users.
 */
const loginSpotify = async () => {
  // we use this because axios does not automatically allow for redirects
  window.location.href = `${SPOTIFY_API_URL}/auth/spotify`;
};

/**
 * Function to get the user's Spotify playlists
 *
 * @param username - The username of the user to get the playlists for
 * @throws Error if there is an issue fetching the playlists
 */
export const getSpotifyPlaylists = async (username: string) => {

  console.log('getSpotifyPlaylists', SPOTIFY_API_URL);

  try {
    const accessToken = localStorage.getItem('spotify_access_token');
    const res = await api.post(`${SPOTIFY_API_URL}/getPlaylists`, {
      access_token: accessToken,
    });

    return res.data;

  } catch (error) {
    console.error('Error fetching Spotify playlists:', error);
    throw error;
  }
};

export default loginSpotify;
