import { useState } from 'react';
import './index.css';
import { SpotifyPlaylist, SpotifyTrack } from '../../../../hooks/useSpotifySharing';

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

type PanelView = 'main' | 'playlists' | 'songs' | 'tracks';

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
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState<PanelView>('main');
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [hasFetchedPlaylists, setHasFetchedPlaylists] = useState(false);

  const handleSendSelectedPlaylist = () => {
    if (selectedPlaylist) sendPlaylist(selectedPlaylist);
  };

  const handleBrowseTracks = async () => {
    if (selectedPlaylistId) {
      await fetchTracks(selectedPlaylistId);
      setView('tracks');
    }
  };

  if (!isConnected) return null;

  return (
    <div className={`spotify-container ${panelOpen ? 'open' : ''}`}>
      {!panelOpen && (
        <button
          className='spotify-toggle-button'
          onClick={async () => {
            setPanelOpen(true);
            setView('main');
            setSelectedPlaylist(null);
            setSelectedPlaylistId(null);

            if (!hasFetchedPlaylists) {
              await fetchPlaylists();
              setHasFetchedPlaylists(true);
            }
          }}>
          Spotify
        </button>
      )}

      <div className={`spotify-panel ${panelOpen ? 'slide-in' : 'slide-out'}`}>
        {(view !== 'main' || panelOpen) && (
          <div className='spotify-action-row'>
            {view !== 'main' && (
              <button className='spotify-action-button half-width' onClick={() => setView('main')}>
                ← Back
              </button>
            )}
            <button
              className={`spotify-action-button ${view !== 'main' ? 'half-width' : ''}`}
              onClick={() => {
                setPanelOpen(false);
                setView('main');
              }}>
              Hide Spotify
            </button>
          </div>
        )}

        {view === 'main' && (
          <>
            <div className='spotify-section'>
              <button className='spotify-button' onClick={() => setView('playlists')}>
                Share a Playlist
              </button>
            </div>

            <div className='spotify-section'>
              <button className='spotify-button' onClick={() => setView('songs')}>
                Share a Song
              </button>
            </div>

            {currentlyPlayingAvailable && (
              <div className='spotify-section'>
                <button className='spotify-button' onClick={sendCurrentTrack}>
                  Share What I’m Listening To
                </button>
              </div>
            )}
          </>
        )}

        {view === 'playlists' && (
          <div className='spotify-section'>
            <h4>Select a Playlist to Share</h4>
            <div className='playlist-dropdown'>
              <select
                value={selectedPlaylist?.id || ''}
                onChange={e => {
                  const selected = playlists.find(p => p.id === e.target.value);
                  setSelectedPlaylist(selected || null);
                }}>
                <option value='' disabled>
                  Select a playlist
                </option>
                {playlists.map(playlist => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className='spotify-button'
              onClick={handleSendSelectedPlaylist}
              disabled={!selectedPlaylist}>
              Send Playlist
            </button>
          </div>
        )}

        {view === 'songs' && (
          <div className='spotify-section'>
            <h4>Pick a Playlist to Browse Songs</h4>
            <div className='playlist-dropdown'>
              <select
                value={selectedPlaylistId || ''}
                onChange={e => setSelectedPlaylistId(e.target.value)}>
                <option value='' disabled>
                  Select a playlist
                </option>
                {playlists.map(playlist => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className='spotify-button'
              onClick={handleBrowseTracks}
              disabled={!selectedPlaylistId}>
              View Songs
            </button>
          </div>
        )}

        {view === 'tracks' && (
          <div className='spotify-tracks scrollable'>
            <h4>Songs in Playlist</h4>
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
    </div>
  );
};

export default SpotifySharingComponent;
