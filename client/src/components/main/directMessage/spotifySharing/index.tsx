import { useEffect, useState } from 'react';
import './index.css';
import { SpotifyPlaylist, SpotifyTrack } from '../../../../hooks/useSpotifySharing';


/**
 * Props for SpotifySharingComponent.
 * Handles rendering Spotify content to be shared within the chat UI.
 */
interface SpotifySharingProps {
  isConnected: boolean;
  playlists: SpotifyPlaylist[];
  playlistTracks: SpotifyTrack[];
  currentlyPlayingAvailable: boolean;
  fetchPlaylists: () => Promise<void>;
  fetchTracks: (playlistId: string) => Promise<void>;
  sendPlaylist: (playlist: SpotifyPlaylist) => Promise<void>;
  sendSong: (song: SpotifyTrack) => Promise<void>;
  sendCurrentTrack: () => Promise<void>;
  error: string | null;
}

/**
 * SpotifySharingComponent provides UI to share playlists, songs, and the user's currently playing track.
 */
const SpotifySharingComponent = ({
  isConnected,
  playlists,
  playlistTracks,
  currentlyPlayingAvailable,
  fetchPlaylists,
  fetchTracks,
  sendPlaylist,
  sendSong,
  sendCurrentTrack,
}: SpotifySharingProps) => {
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (panelOpen) {
      fetchPlaylists();
    }
  }, [panelOpen, fetchPlaylists]);

  if (!isConnected) return null;
  return (
    <div className='spotify-container'>
      <button className='spotify-toggle-button' onClick={() => setPanelOpen(prev => !prev)}>
        {panelOpen ? 'Hide Spotify' : 'Spotify'}
      </button>

      {panelOpen && (
        <div className='spotify-panel'>
          <div className='spotify-section'>
            <h4>Share a Playlist</h4>
            {playlists.map(playlist => (
              <button
                key={playlist.id}
                className='spotify-button'
                onClick={() => sendPlaylist(playlist)}>
                {playlist.name}
              </button>
            ))}
          </div>

          <div className='spotify-section'>
            <h4>Share a Song</h4>
            {playlists.map(playlist => (
              <button
                key={`browse-${playlist.id}`}
                className='spotify-button'
                onClick={() => {
                  setExpandedPlaylistId(playlist.id);
                  fetchTracks(playlist.id);
                }}>
                Browse: {playlist.name}
              </button>
            ))}
            {expandedPlaylistId && playlistTracks.length > 0 && (
              <div className='spotify-tracks'>
                {playlistTracks.map((track, i) => (
                  <button
                    key={`track-${i}`}
                    className='spotify-track-button'
                    onClick={() => sendSong(track)}>
                    {track.name} — {track.artists.join(', ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentlyPlayingAvailable && (
            <div className='spotify-section'>
              <h4>Now Playing</h4>
              <button className='spotify-button' onClick={sendCurrentTrack}>
                Share Current Song
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpotifySharingComponent;