import { SearchedSong, SpotifyTrackItem } from '../types/spotify';
import api from './config';

const SPOTIFY_API_URL = `${process.env.REACT_APP_SERVER_URL}/spotify`;

/**
 * Initiates the Spotify login flow by redirecting the browser to the backend Spotify auth endpoint.
 * This will kick off the OAuth process with Spotify.
 * @throws This function does not throw but initiates a page redirect.
 */
export const loginSpotify = async () => {
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
  // try {
  //   const res = await api.get(`${SPOTIFY_API_URL}/current-track`, {
  //     params: { username },
  //   });
  //   return { isPlaying: true, ...res.data };
  // } catch (err) {
  //   return { isPlaying: false, error: true };
  // }
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


/**
 * Function to search for a song on Spotify
 *
 * @param query - The query to search for
 * @throws Error if there is an issue searching for the song
 */
export const searchSpotifySong = async (query: string) => {
  const accessToken = localStorage.getItem('spotify_access_token');
  const res = await api.post(`${SPOTIFY_API_URL}/searchSong`, {
    access_token: accessToken,
    query,
  });

  return res.data;
};

/**
 * Function to search for a playlist containing a specified song on Spotify
 *
 * @param query - The query to search for
 * @throws Error if there is an issue searching for the playlist
 */
export const searchSpotifyPlaylistWithSong = async (query: string) => {
  const accessToken = localStorage.getItem('spotify_access_token');
  const res = await api.post(`${SPOTIFY_API_URL}/searchSpotifyPlaylistWithSong`, {
    access_token: accessToken,
    query,
  });

  return res.data;
};

/**
 * Function to get the songs from a Spotify playlist
 *
 * @param playlistId - The ID of the playlist to get the songs from
 * @throws Error if there is an issue getting the songs from the playlist
 */
export const getSongsFromSpotifyPlaylist = async (playlistId: string) => {
  const accessToken = localStorage.getItem('spotify_access_token');
  const res = await api.post(`${SPOTIFY_API_URL}/getSongsFromSpotifyPlaylist`, {
    access_token: accessToken,
    playlistId,
  });

  return res.data;
};


/**
 * Helper function to check if a song in a playlist is the song we are searching for
 * @param searchedSong - The song object user is finding recommendations for
 * @param item - The current song in the playlist
 * @param query - The name of the song user is finding recommendations for
 * @returns True if the song is the song we are searching for, false otherwise
 */
const isSameSong = (searchedSong: SearchedSong, item: SpotifyTrackItem, songName:string) => {
  const trackName = item.track.name.toLowerCase().trim();
  const artists = item.track.artists.map((artist) => artist.name.toLowerCase().trim()).join(', ');
  const combined = `${trackName} ${artists}`;
  const searchQuery = songName.toLowerCase().trim();

  return item.track.id === searchedSong.id || combined.includes(searchQuery);
};


/**
 * Function to recommend songs based on a song
 *
 * @param songName - The naem of the song to recommend other songs on
 * @throws Error if there is an issue recommending the songs
 */
export const recommendSongs = async (songName: string) => {
  const playlistWithSong = await searchSpotifyPlaylistWithSong(songName);
  if (!playlistWithSong) return [];

  // get searched song's info so that we can remove it from recommendations
  const searchedSong = await searchSpotifySong(songName);
  if (!searchedSong) return [];

  const playlistId = playlistWithSong.items[0].id; 
  const songsFromPlaylist = await getSongsFromSpotifyPlaylist(playlistId);

  // remove the song itself, fields we don't need, and limit to 5 songs
  const cleanedSongs = (songsFromPlaylist as SpotifyTrackItem[])
    .filter((item) => item.track)
    .filter((item) => !isSameSong(searchedSong, item, songName))
    .map((item) => ({
      name: item.track.name,
      artist: item.track.artists.map((artist) => artist.name).join(', '),
      url: item.track.external_urls.spotify,
    }))
    .slice(0, 5);

  return cleanedSongs;
};