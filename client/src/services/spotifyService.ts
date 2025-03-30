import api from './config';

const SPOTIFY_API_URL = `${process.env.REACT_APP_SERVER_URL}/spotify`;

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
export const getSpotifyPlaylists = async () => {

  const accessToken = localStorage.getItem('spotify_access_token');
  const res = await api.post(`${SPOTIFY_API_URL}/getPlaylists`, {
    access_token: accessToken,
  });

  return res.data;
};

export const getPlaylistTracks = async (playlistId: string) => {
  const accessToken = localStorage.getItem('spotify_access_token');
  const res = await api.post(`${SPOTIFY_API_URL}/getPlaylistTracks`, {
    playlistId,
    access_token: accessToken,
  });
  return res.data.tracks;
};

export const getCurrentlyPlaying = async () => {
  const res = await api.get(`${SPOTIFY_API_URL}/current-track`);
  return res.data;
};

export const checkSpotifyStatus = async (username: string) => {
  const res = await api.get(`${SPOTIFY_API_URL}/isConnected`, {
    params: { username },
  });
  return res.data; // { isConnected, currentlyPlaying }
};

export default loginSpotify;