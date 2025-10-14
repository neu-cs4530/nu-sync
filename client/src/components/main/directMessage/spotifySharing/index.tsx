import React, { useEffect, useState, useCallback } from 'react';
import { BsChevronLeft, BsChevronRight, BsSpotify } from 'react-icons/bs';
import { FaMusic, FaListUl, FaPlayCircle, FaThumbsUp } from 'react-icons/fa';
import { SpotifyTrackItem, RecommendedSong, SpotifyPlaylist } from '../../../../types/spotify';
import SpotifySongCard from '../spotifyCards/songs';

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
  panelOpen: boolean;
  setPanelOpen: (value: boolean) => void;
}

type PanelView = 'main' | 'playlists' | 'songs' | 'tracks' | 'recommendations';

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
  panelOpen,
  setPanelOpen,
}: SpotifySharingProps) => {
  const [view, setView] = useState<PanelView>('main');
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [hasFetchedPlaylists, setHasFetchedPlaylists] = useState(false);

  // Prevent propagation for keyboard events
  const preventPropagation = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  // Initialize panel when opened
  useEffect(() => {
    const initializePanel = async () => {
      if (panelOpen && !hasFetchedPlaylists) {
        await fetchPlaylists();
        setHasFetchedPlaylists(true);
      }
    };

    if (panelOpen) {
      initializePanel();
    }
  }, [panelOpen, hasFetchedPlaylists, fetchPlaylists]);

  // Handle sending a playlist
  const handleSendSelectedPlaylist = () => {
    if (selectedPlaylist) {
      sendPlaylist(selectedPlaylist);
      setPanelOpen(false);
    }
  };

  // Handle browsing tracks in a playlist - CRUCIAL FIX: This needs to work
  const handleBrowseTracks = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedPlaylistId) {
      try {
        await fetchTracks(selectedPlaylistId);
        setView('tracks');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching tracks:', err);
      }
    }
  };

  // Handle getting recommendations
  const handleGetRecommendations = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setView('recommendations');
  };

  // Handle recommendation search
  const handleRecommendationSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleRecommendSongs();
  };

  if (!isConnected) return null;

  return (
    <div className='relative w-full z-10'>
      {panelOpen && (
        <div
          className='fixed bottom-20 w-80 bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 border border-gray-700 animate-fade-in'
          onClick={e => e.stopPropagation()}>
          {/* Header with back button */}
          <div className='flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700'>
            <div className='flex items-center gap-2'>
              <BsSpotify className='text-[#1db954] text-xl' />
              <span className='font-medium text-white text-base'>Spotify</span>
            </div>
            {view !== 'main' && (
              <button
                className='text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700'
                onClick={e => {
                  e.stopPropagation();
                  setView('main');
                }}>
                <BsChevronLeft size={18} />
              </button>
            )}
            <button
              className='text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700'
              onClick={e => {
                e.stopPropagation();
                setPanelOpen(false);
              }}>
              ✕
            </button>
          </div>

          {/* Main menu */}
          {view === 'main' && (
            <div className='py-2'>
              <button
                className='w-full px-4 py-3 flex items-center gap-2 text-gray-200 hover:bg-gray-700 text-left text-base'
                onClick={e => {
                  e.stopPropagation();
                  setView('playlists');
                }}>
                <FaListUl className='text-[#1db954] text-lg' />
                <span>Share a Playlist</span>
                <BsChevronRight className='ml-auto text-white-400' />
              </button>

              <button
                className='w-full px-4 py-3 flex items-center gap-2 text-gray-200 hover:bg-gray-700 text-left text-base'
                onClick={e => {
                  e.stopPropagation();
                  setView('songs');
                }}>
                <FaMusic className='text-[#1db954] text-lg' />
                <span>Share a Song</span>
                <BsChevronRight className='ml-auto text-white-400' />
              </button>

              {currentlyPlayingAvailable && (
                <button
                  className='w-full px-4 py-3 flex items-center gap-2 text-gray-200 hover:bg-gray-700 text-left text-base'
                  onClick={e => {
                    e.stopPropagation();
                    sendCurrentTrack();
                    setPanelOpen(false);
                  }}>
                  <FaPlayCircle className='text-[#1db954] text-lg' />
                  <span>Share Current Song</span>
                </button>
              )}

              <button
                className='w-full px-4 py-3 flex items-center gap-2 text-gray-200 hover:bg-gray-700 text-left text-base'
                onClick={handleGetRecommendations}>
                <FaThumbsUp className='text-[#1db954] text-lg' />
                <span>Get Song Recommendations</span>
                <BsChevronRight className='ml-auto text-white-400' />
              </button>
            </div>
          )}

          {/* Playlists submenu */}
          {view === 'playlists' && (
            <div className='p-4'>
              <h4 className='text-[#1db954] font-medium mb-3 text-center text-base'>
                Select a Playlist
              </h4>

              <select
                className='w-full mb-4 bg-gray-700 text-white border border-gray-600 rounded p-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-[#1db954]'
                value={selectedPlaylist?.id || ''}
                onChange={e => {
                  e.stopPropagation();
                  const selected = playlists.find(p => p.id === e.target.value);
                  setSelectedPlaylist(selected || null);
                }}
                onClick={e => e.stopPropagation()}
                onKeyDown={preventPropagation}>
                <option value='' disabled>
                  Choose a playlist
                </option>
                {playlists.map(playlist => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </option>
                ))}
              </select>

              <div className='flex justify-center'>
                <button
                  className='py-2.5 px-6 bg-[#1db954] hover:bg-[#18a549] text-white rounded text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  onClick={e => {
                    e.stopPropagation();
                    handleSendSelectedPlaylist();
                  }}
                  disabled={!selectedPlaylist}>
                  Share Playlist
                </button>
              </div>
            </div>
          )}

          {/* Songs submenu */}
          {view === 'songs' && (
            <div className='p-4'>
              <h4 className='text-[#1db954] font-medium mb-3 text-center text-base'>
                Select a Playlist
              </h4>

              <select
                className='w-full mb-4 bg-gray-700 text-white border border-gray-600 rounded p-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-[#1db954]'
                value={selectedPlaylistId || ''}
                onChange={e => {
                  e.stopPropagation();
                  setSelectedPlaylistId(e.target.value);
                }}
                onClick={e => e.stopPropagation()}
                onKeyDown={preventPropagation}>
                <option value='' disabled>
                  Choose a playlist
                </option>
                {playlists.map(playlist => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </option>
                ))}
              </select>

              <div className='flex justify-center'>
                <button
                  className='py-2.5 px-6 bg-[#1db954] hover:bg-[#18a549] text-white rounded text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  onClick={handleBrowseTracks}
                  disabled={!selectedPlaylistId}>
                  Browse Songs
                </button>
              </div>
            </div>
          )}

          {/* Tracks submenu */}
          {view === 'tracks' && (
            <div className='p-4'>
              <h4 className='text-[#1db954] font-medium mb-3 text-center text-base'>
                Select a Song to Share
              </h4>

              <div className='max-h-64 overflow-y-auto mb-2 bg-gray-700 border border-gray-600 rounded'>
                {playlistTracks.length > 0 ? (
                  playlistTracks.map((trackItem, index) => (
                    <SpotifySongCard
                      key={index}
                      name={trackItem.track.name}
                      artists={trackItem.track.artists.map(a => a.name)}
                      spotifyUrl={trackItem.track.external_urls.spotify}
                      onClick={() => {
                        sendSong(trackItem);
                        setPanelOpen(false);
                      }}
                    />
                  ))
                ) : (
                  <div className='p-4 text-gray-400 text-base italic text-center'>
                    No tracks found in playlist
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations submenu */}
          {view === 'recommendations' && (
            <div className='p-4'>
              <h4 className='text-[#1db954] font-medium mb-3 text-center text-base'>
                Get Song Recommendations
              </h4>

              <div className='mb-4'>
                <input
                  type='text'
                  value={songForRecommendation}
                  onChange={e => {
                    e.stopPropagation();
                    setSongForRecommendation(e.target.value);
                    setShowDisplayRecommendedSongs(false);
                  }}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={preventPropagation}
                  placeholder='Enter a song name...'
                  className='w-full mb-3 bg-gray-700 text-white border border-gray-600 rounded p-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-[#1db954]'
                />

                <div className='flex justify-center'>
                  <button
                    className='py-2.5 px-6 mb-3 bg-[#1db954] hover:bg-[#18a549] text-white rounded text-base font-medium transition-colors'
                    onClick={handleRecommendationSearch}>
                    Get Recommendations
                  </button>
                </div>
              </div>

              {showDisplayRecommendedSongs && recommendedSongs.length > 0 ? (
                <div className='max-h-64 overflow-y-auto bg-gray-700 border border-gray-600 rounded'>
                  {recommendedSongs.map((song: RecommendedSong) => {
                    const fakeTrackItem: SpotifyTrackItem = {
                      track: {
                        id: song.url.split('/').pop() || song.url,
                        name: song.name,
                        artists: [{ name: song.artist }],
                        external_urls: { spotify: song.url },
                      },
                    };

                    return (
                      <SpotifySongCard
                        key={song.url}
                        name={song.name}
                        artists={[song.artist]}
                        spotifyUrl={song.url}
                        onClick={() => {
                          sendSong(fakeTrackItem); // ✅ use the real sendSong
                          setPanelOpen(false);
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                showDisplayRecommendedSongs && (
                  <div className='p-3 text-gray-400 text-base italic text-center'>
                    No recommendations found
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpotifySharingComponent;

