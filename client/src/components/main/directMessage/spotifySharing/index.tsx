import { useState } from 'react';
import './index.css';
import { SpotifyTrackItem, RecommendedSong, SpotifyPlaylist } from '../../../../types/spotify';

interface SpotifySharingProps {
  isConnected: boolean;
  playlists: SpotifyPlaylist[];
  playlistTracks: SpotifyTrackItem[];
  currentlyPlayingAvailable: boolean;
  fetchPlaylists: () => Promise<void>;
  fetchTracks: (playlistId: string) => Promise<void>;
  sendPlaylist: (playlist: SpotifyPlaylist) => Promise<void>;
  sendSong: (song: SpotifyTrackItem) => Promise<void>;
  sendCurrentTrack: () => Promise<void>;
  error: string | null;
  handleRecommendSongs: () => void;
  recommendedSongs: RecommendedSong[];
  songForRecommendation: string;
  setSongForRecommendation: (value: string) => void;
  showDisplayRecommendedSongs: boolean;
  setShowDisplayRecommendedSongs: (value: boolean) => void;
  showRecommendationInputDialog: boolean;
  setShowRecommendationInputDialog: (value: boolean) => void;
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
  handleRecommendSongs,
  recommendedSongs,
  songForRecommendation,
  setSongForRecommendation,
  showDisplayRecommendedSongs,
  setShowDisplayRecommendedSongs,
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
        {/* Spotify Recommendation Input dialog */}
        <div className='recommendation-input-dialog'>
          <input
            type='text'
            value={songForRecommendation}
            onChange={e => {
              setSongForRecommendation(e.target.value);
              setShowDisplayRecommendedSongs(false);
            }}
            className='recommendation-input'
            placeholder='Like a song you heard? Enter the name here to get recommendations based on it.'
          />
        </div>
        <button
          className='custom-button'
          onClick={() => {
            setSongForRecommendation('');
            handleRecommendSongs();
          }}>
          Get Song Recommendations
        </button>

        {showDisplayRecommendedSongs && recommendedSongs.length > 0 && (
          <div className='recommended-songs'>
            {recommendedSongs.map((song: RecommendedSong) => (
              <p key={song.url}>
                {song.name} - {song.artist}.{' '}
                <a href={song.url} target='_blank' rel='noopener noreferrer'>
                  Listen on Spotify
                </a>
              </p>
            ))}
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
          <div className='spotify-section'>
            <h4>Songs in Playlist</h4>
            <div className='playlist-dropdown'>
              <select
                size={8}
                onChange={e => {
                  const selectedIndex = parseInt(e.target.value, 10);
                  const selectedTrack = playlistTracks[selectedIndex];
                  if (selectedTrack) {
                    sendSong(selectedTrack);
                  }
                }}>
                <option value='' disabled selected>
                  Select a song to share
                </option>
                {playlistTracks.map((trackItem, index) => {
                  const artistNames = trackItem.track.artists?.map(a => a.name).join(', ');
                  const trackName = trackItem.track.name;

                  return (
                    <option key={index} value={index}>
                      {trackName} — {artistNames}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifySharingComponent;
