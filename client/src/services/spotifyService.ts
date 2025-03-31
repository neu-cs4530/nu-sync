import api from './config';
import { SpotifyTrackItem, SearchedSong } from '../types/spotify';

const SPOTIFY_API_URL = `${process.env.REACT_APP_SERVER_URL}/spotify`;

/**
 * Function to login with spotify
 *
 * @throws Error if there is an issue fetching users.
 */
export const loginSpotify = async () => {
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

  const accessToken = localStorage.getItem('spotify_access_token');
  const res = await api.post(`${SPOTIFY_API_URL}/getPlaylists`, {
    access_token: accessToken,
  });

  return res.data;
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
