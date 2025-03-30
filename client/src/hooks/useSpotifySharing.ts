import { useState, useEffect } from 'react';
import { ObjectId } from 'mongodb';
import {
  getSpotifyPlaylists,
  getPlaylistTracks,
  getCurrentlyPlaying,
  checkSpotifyStatus,
} from '../services/spotifyService';
import { Message } from '../types/types';
import useUserContext from './useUserContext';
import { sendMessage } from '../services/chatService';

export interface SpotifyPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: { spotify: string };
  href: string;
  id: string;
  images: { url: string }[];
  name: string;
  owner: {
    display_name: string;
    external_urls: { spotify: string };
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  public: boolean;
  snapshot_id: string;
  tracks: { href: string; total: number };
  type: string;
  uri: string;
}

export interface SpotifyTrack {
  name: string;
  url: string;
  artists: string[];
}

const useSpotifySharing = (selectedChatId: ObjectId | undefined) => {
  const { user } = useUserContext();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [currentlyPlayingAvailable, setCurrentlyPlayingAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkSpotifyConnection = async () => {
      try {
        const { isConnected: connected, currentlyPlaying } = await checkSpotifyStatus(
          user.username,
        );
        setIsConnected(connected);
        setCurrentlyPlayingAvailable(currentlyPlaying);
      } catch {
        setIsConnected(false);
        setCurrentlyPlayingAvailable(false);
      }
    };

    checkSpotifyConnection();
  }, [user.username]);

  const fetchPlaylists = async () => {
    try {
      const data = await getSpotifyPlaylists(user.username);
      setPlaylists(data.items || data);
    } catch {
      setError('Failed to fetch playlists.');
    }
  };

  const fetchTracks = async (playlistId: string) => {
    try {
      const tracks = await getPlaylistTracks(playlistId);
      setPlaylistTracks(tracks);
    } catch {
      setError('Failed to fetch tracks.');
    }
  };

  const sendPlaylist = async (playlist: SpotifyPlaylist) => {
    if (!selectedChatId) return;
    const message: Omit<Message, 'type'> = {
      msg: ` Playlist: ${playlist.name}\n${playlist.external_urls.spotify}`,
      msgFrom: user.username,
      msgDateTime: new Date(),
    };
    await sendMessage(message, selectedChatId);
  };

  const sendSong = async (song: SpotifyTrack) => {
    if (!selectedChatId) return;
    const message: Omit<Message, 'type'> = {
      msg: ` ${song.name} by ${song.artists.join(', ')}\n${song.url}`,
      msgFrom: user.username,
      msgDateTime: new Date(),
    };
    await sendMessage(message, selectedChatId);
  };

  const sendCurrentTrack = async () => {
    if (!selectedChatId) return;
    try {
      const track = await getCurrentlyPlaying();
      if (!track?.isPlaying) return;
      const message: Omit<Message, 'type'> = {
        msg: `Now Playing: ${track.name} by ${track.artists.join(', ')}\n${track.url}`,
        msgFrom: user.username,
        msgDateTime: new Date(),
      };
      await sendMessage(message, selectedChatId);
    } catch {
      setError('Could not get current track');
    }
  };

  return {
    playlists,
    playlistTracks,
    currentlyPlayingAvailable,
    isConnected,
    fetchPlaylists,
    fetchTracks,
    sendPlaylist,
    sendSong,
    sendCurrentTrack,
    error,
  };
};

export default useSpotifySharing;
