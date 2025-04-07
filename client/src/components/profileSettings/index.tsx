import React, { useEffect } from 'react';
import './index.css';
import useProfileSettings from '../../hooks/useProfileSettings';
import useSpotifyAuth from '../../hooks/useSpotifyAuth';
import SpotifyConflictModal from './spotifyConflict';
import UserStatusIcon from '../main/UserStatusIcon';

const ProfileSettings: React.FC = () => {
  const {
    handleLoginUserSpotify,
    userData,
    loading,
    editBioMode,
    newBio,
    newPassword,
    confirmNewPassword,
    successMessage,
    errorMessage,
    showConfirmation,
    pendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    setEditBioMode,
    setNewBio,
    setNewPassword,
    setConfirmNewPassword,
    setShowConfirmation,
    handleResetPassword,
    handleUpdateBiography,
    handleDeleteUser,
    mutualFriends,
    mutualFriendsLoading,
    currentPlayingSong,
    showSpotifyConflictModal,
    setShowSpotifyConflictModal,
    handleUnlinkAllAndRetry,
    profileVisibility,
    handleUpdateProfileVisibility,
    pendingVisibility,
    setPendingVisibility,
    openVisibilityConfirmation,
    showVisibilityModal,
    setShowVisibilityModal,
    friendList,
    handleUpdateQuietHours,
    showQuietHoursModal,
    setShowQuietHoursModal,
    quietHoursStart,
    setQuietHoursStart,
    quietHoursEnd,
    setQuietHoursEnd,
    spotifyCompatibilityScore
  } = useProfileSettings();

  const { isSpotifyConnected, spotifyUserId, disconnect } = useSpotifyAuth();


  // function to determine what emoji to show for the spotify compatibility calculator
  const getEmojiSvg = (score: number | undefined) => {
    if (score === undefined) return null;

    const percent = Math.round(score * 100);

    if (percent >= 70) {
      return (
        <svg className='w-12 h-12 text-green-500' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 17c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4zm-3-7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
        </svg>
      );
    } if (percent >= 40) {
      return (
        <svg className="w-12 h-12 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
          <circle cx="9" cy="10" r="1.5" fill="#fff" />
          <circle cx="15" cy="10" r="1.5" fill="#fff" />
          <rect x="8" y="15" width="8" height="1.5" rx="0.75" fill="#fff" />
        </svg>

      );
    } 
      return (
        <svg className='w-12 h-12 text-red-500' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.656 17.657a.75.75 0 01-1.06 0c-2.954-2.954-7.738-2.954-10.692 0a.75.75 0 11-1.06-1.06c3.515-3.515 9.298-3.515 12.812 0a.75.75 0 010 1.06zM16 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-5.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
        </svg>
      );
    
  };



  useEffect(() => {}, [isSpotifyConnected, spotifyUserId]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center'>
        <div className='w-full max-w-md p-8 bg-white rounded-xl shadow-md'>
          <div className='flex justify-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
          </div>
          <p className='mt-4 text-center text-gray-600'>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        {/* Success and Error Alerts */}
        {successMessage && (
          <div className='mb-4 p-4 rounded-md bg-green-50 border border-green-200'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-green-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm font-medium text-green-800'>{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className='mb-4 p-4 rounded-md bg-red-50 border border-red-200'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm font-medium text-red-800'>{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
        {userData ? (
          <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
            {/* Header */}
            <div className='px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-700'>
              <h2 className='text-xl leading-6 font-bold text-white'>Profile Settings</h2>
              <p className='mt-1 max-w-2xl text-sm text-blue-100'>
                Personal details and preferences
              </p>
            </div>

            <div className='border-t border-gray-200 px-4 py-5 sm:p-6'>
              {/* General Information */}
              <div className='mb-8'>
                <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                  General Information
                </h3>
                <div className='bg-gray-50 p-4 rounded-md'>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div className='sm:col-span-1'>
                      <div className='text-sm font-medium text-gray-500'>Username</div>
                      <div className='mt-1 text-sm text-gray-900 flex items-center'>
                        {userData.username}
                        <UserStatusIcon status={userData.onlineStatus?.status ?? 'online'} />
                      </div>
                    </div>
                    <div className='sm:col-span-1'>
                      <div className='text-sm font-medium text-gray-500'>Date Joined</div>
                      <div className='mt-1 text-sm text-gray-900'>
                        {userData.dateJoined
                          ? new Date(userData.dateJoined).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Friends Section */}
              <div className='mb-8'>
                <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>Friends</h3>
                <div className='bg-gray-50 p-4 rounded-md'>
                  <div className='text-sm text-gray-700'>
                    {friendList && friendList.length > 0 ? (
                      <div className='flex flex-wrap gap-2'>
                        {friendList.map(friend => (
                          <span
                            key={friend.username}
                            className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                            {friend.username}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className='text-gray-500 italic'>No friends yet.</p>
                    )}
                  </div>
                </div>

                {/* Mutual Friends Section */}
                {!canEditProfile && (
                  <div className='mt-4'>
                    <h4 className='text-md font-medium text-gray-700 mb-2'>Mutual Friends</h4>
                    <div className='bg-gray-50 p-4 rounded-md'>
                      {(() => {
                        // Using an IIFE to handle conditional rendering
                        if (mutualFriendsLoading) {
                          return (
                            <div className='flex items-center'>
                              <div className='animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-blue-500 rounded-full'></div>
                              <span className='text-sm text-gray-500'>
                                Loading mutual friends...
                              </span>
                            </div>
                          );
                        }

                        if (mutualFriends.length > 0) {
                          return (
                            <div className='flex flex-wrap gap-2'>
                              {mutualFriends.map(friend => (
                                <span
                                  key={friend}
                                  className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800'>
                                  {friend}
                                </span>
                              ))}
                            </div>
                          );
                        }

                        return (
                          <p className='text-sm text-gray-500 italic'>No mutual friends found.</p>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              {/* Biography Section */}
              <div className='mb-8'>
                <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>Biography</h3>
                {!editBioMode ? (
                  <div className='bg-gray-50 p-4 rounded-md flex justify-between items-start'>
                    <p className='text-sm text-gray-700'>
                      {userData.biography || 'No biography yet.'}
                    </p>
                    {canEditProfile && (
                      <button
                        className='ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        onClick={() => {
                          setEditBioMode(true);
                          setNewBio(userData.biography || '');
                        }}>
                        <svg
                          className='h-4 w-4 mr-1'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                          />
                        </svg>
                        Edit
                      </button>
                    )}
                  </div>
                ) : (
                  <div className='bg-gray-50 p-4 rounded-md'>
                    <textarea
                      className='w-full px-3 py-2 text-sm text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      value={newBio}
                      onChange={e => setNewBio(e.target.value)}
                      rows={4}></textarea>
                    <div className='mt-3 flex justify-end space-x-3'>
                      <button
                        className='inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        onClick={handleUpdateBiography}>
                        Save
                      </button>
                      <button
                        className='inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        onClick={() => setEditBioMode(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {canEditProfile && (
                <div className='profile-settings-section'>
                  <h4>Quiet Hours</h4>
                  <p className='setting-description'>
                    Automatically sets your status to DND and silences notifications.
                  </p>
                  <button
                    className='login-button'
                    onClick={() => {
                      if (userData?.quietHours) {
                        setQuietHoursStart(userData.quietHours.start);
                        setQuietHoursEnd(userData.quietHours.end);
                      } else {
                        setQuietHoursStart('');
                        setQuietHoursEnd('');
                      }
                      setShowQuietHoursModal(true);
                    }}>
                    Set Quiet Hours
                  </button>
                </div>
              )}
              {canEditProfile && userData?.quietHours && (
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#555' }}>
                  Current Quiet Hours: {userData.quietHours.start} – {userData.quietHours.end}
                </p>
              )}

              {showQuietHoursModal && canEditProfile && (
                <div className='quiet-hours-modal'>
                  <div className='modal-content quiet-hours-modal-content'>
                    <h3>Set Quiet Hours</h3>
                    <p className='modal-info'>
                      This will schedule you to block notifications within this time frame.
                    </p>
                    <div className='modal-inputs'>
                      <label>
                        Start Time:
                        <input
                          type='time'
                          value={quietHoursStart}
                          onChange={e => setQuietHoursStart(e.target.value)}
                          className='input-text'
                        />
                      </label>
                      <label style={{ marginTop: '1rem' }}>
                        End Time:
                        <input
                          type='time'
                          value={quietHoursEnd}
                          onChange={e => setQuietHoursEnd(e.target.value)}
                          className='input-text'
                        />
                      </label>
                    </div>
                    <div className='modal-buttons' style={{ marginTop: '1rem' }}>
                      <button
                        className='login-button'
                        onClick={() => {
                          if (quietHoursStart && quietHoursEnd) {
                            handleUpdateQuietHours({
                              start: quietHoursStart,
                              end: quietHoursEnd,
                            });
                            setShowQuietHoursModal(false);
                            setQuietHoursStart('');
                            setQuietHoursEnd('');
                          }
                        }}>
                        Confirm
                      </button>
                      <button
                        className='delete-button'
                        onClick={() => {
                          setShowQuietHoursModal(false);
                          setQuietHoursStart('');
                          setQuietHoursEnd('');
                        }}>
                        Cancel
                      </button>
                      {userData?.quietHours && (
                        <button
                          className='delete-button'
                          style={{ marginTop: '0.5rem' }}
                          onClick={() => {
                            handleUpdateQuietHours(); // clears it
                            setShowQuietHoursModal(false);
                            setQuietHoursStart('');
                            setQuietHoursEnd('');
                          }}>
                          Clear Quiet Hours
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Visibility (Only for profile owner) */}
              {canEditProfile && (
                <div className='mb-8'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                    Profile Visibility
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-md'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-700'>
                          Current visibility:{' '}
                          <span
                            className={`font-semibold ${profileVisibility === 'public' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {profileVisibility === 'public' ? 'Public' : 'Private'}
                          </span>
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          {profileVisibility === 'public'
                            ? 'Anyone can add you as a friend instantly'
                            : 'Friend requests require your approval'}
                        </p>
                      </div>

                      <div></div>
                      <button
                        className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          profileVisibility === 'public'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500'
                        }`}
                        onClick={() =>
                          openVisibilityConfirmation(
                            profileVisibility === 'public' ? 'private' : 'public',
                          )
                        }>
                        Change to {profileVisibility === 'public' ? 'Private' : 'Public'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Spotify Connection */}
              <div className='mb-8'>
                <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                  Spotify Connection
                </h3>
                <div className='bg-gray-50 p-4 rounded-md'>
                  {canEditProfile ? (
                    <div>
                      {isSpotifyConnected ? (
                        <div className='mb-4'>
                          <div className='flex items-center mb-2'>
                            <svg
                              className='w-5 h-5 text-green-500 mr-2'
                              fill='currentColor'
                              viewBox='0 0 20 20'>
                              <path
                                fillRule='evenodd'
                                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                clipRule='evenodd'
                              />
                            </svg>
                            <span className='text-sm font-medium text-green-800'>
                              Connected to Spotify
                            </span>
                          </div>
                          {spotifyUserId && (
                            <p className='text-sm text-gray-600 ml-7'>
                              Spotify User ID: {spotifyUserId}
                            </p>
                          )}

                          <button
                            className='mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                            onClick={disconnect}>
                            Disconnect Spotify
                          </button>
                        </div>
                      ) : (
                        <div className='mb-4'>
                          <p className='text-sm text-gray-600 mb-3'>
                            Connect your Spotify account to share music with friends
                          </p>
                          <button
                            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                            onClick={handleLoginUserSpotify}>
                            <svg className='h-5 w-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                              <path d='M10 2C5.589 2 2 5.589 2 10s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8zm3.64 11.546a.5.5 0 01-.685.174c-1.88-1.148-4.246-1.408-7.028-.772a.499.499 0 11-.222-.973c3.048-.696 5.662-.398 7.76.883a.5.5 0 01.175.688zm.974-2.169a.625.625 0 01-.862.217c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 01-.362-1.194c2.905-.881 6.517-.454 8.986 1.047a.624.624 0 01.21.862zm.094-2.259c-2.578-1.531-6.832-1.672-9.294-.925a.75.75 0 11-.435-1.435c2.825-.857 7.523-.692 10.492 1.07a.75.75 0 11-.763 1.29z' />
                            </svg>
                            Connect Spotify
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Currently Playing Section */}
                  <div className='mt-2'>
                    <h4 className='text-sm font-medium text-gray-700 mb-2'>Currently Playing</h4>
                    {currentPlayingSong &&
                    'track' in currentPlayingSong &&
                    currentPlayingSong.track ? (
                      <div className='flex items-center p-3 bg-white rounded-md border border-gray-200'>
                        <div className='flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center'>
                          <svg
                            className='h-6 w-6 text-gray-500'
                            fill='currentColor'
                            viewBox='0 0 20 20'>
                            <path d='M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z' />
                          </svg>
                        </div>
                        <div className='ml-3 flex-1 min-w-0'>
                          <a
                            href={currentPlayingSong.track.external_urls.spotify}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate'>
                            {currentPlayingSong.track.name}
                          </a>
                          <p className='text-xs text-gray-500 truncate'>
                            {currentPlayingSong.track.artists[0].name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500 italic'>No song is currently playing.</p>
                    )}
                  </div>
                </div>
              </div>


              {/* Spotify Compatibility Score */}
              {!canEditProfile && (
                <div className='mb-8'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                    Spotify Compatibility
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-md flex items-center justify-between'>
                    <div>
                      {spotifyCompatibilityScore !== undefined ? (
                        <>
                          <p className='text-sm font-medium text-gray-700'>
                            Your music taste compatibility with <span className='font-semibold'>{userData?.username}</span> is:
                          </p>
                          <p className='mt-1 text-3xl font-bold text-indigo-600'>
                            {Math.round(spotifyCompatibilityScore * 100)}%
                          </p>
                        </>
                      ) : (
                        <p className='text-sm text-gray-500 italic'>
                          Compatibility unavailable. Either you or {userData?.username} hasn&rsquo;t connected to Spotify.
                        </p>
                      )}
                    </div>
                    <div className='flex-shrink-0'>
                      {getEmojiSvg(spotifyCompatibilityScore)}
                    </div>
                  </div>
                </div>
              )}


              {/* Password Reset (Only for profile owner) */}
              {canEditProfile && (
                <div className='mb-8'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                    Reset Password
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-md'>
                    <div className='space-y-4'>
                      <div>
                        <label
                          htmlFor='new-password'
                          className='block text-sm font-medium text-gray-700'>
                          New Password
                        </label>
                        <div className='mt-1'>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id='new-password'
                            className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor='confirm-password'
                          className='block text-sm font-medium text-gray-700'>
                          Confirm New Password
                        </label>
                        <div className='mt-1'>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id='confirm-password'
                            className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                            value={confirmNewPassword}
                            onChange={e => setConfirmNewPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <button
                          type='button'
                          className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          onClick={togglePasswordVisibility}>
                          {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                        </button>

                        <button
                          type='button'
                          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          onClick={handleResetPassword}>
                          Reset Password
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showSpotifyConflictModal && (
                <SpotifyConflictModal
                  onConfirm={handleUnlinkAllAndRetry}
                  onCancel={() => setShowSpotifyConflictModal(false)}
                />
              )}

              {/* Danger Zone (Only for profile owner) */}
              {canEditProfile && (
                <div>
                  <h3 className='text-lg leading-6 font-medium text-red-600 mb-4'>Danger Zone</h3>
                  <div className='bg-red-50 p-4 rounded-md border border-red-200'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-red-800'>Delete Account</p>
                        <p className='text-xs text-red-700 mt-1'>
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                      </div>
                      <button
                        type='button'
                        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                        onClick={handleDeleteUser}>
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='bg-white shadow overflow-hidden sm:rounded-lg p-6'>
            <div className='flex items-center justify-center'>
              <svg
                className='h-12 w-12 text-gray-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <p className='mt-4 text-center text-gray-600'>
              No user data found. Make sure the username parameter is correct.
            </p>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showConfirmation && (
        <div className='fixed z-10 inset-0 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div className='fixed inset-0 transition-opacity' aria-hidden='true'>
              <div className='absolute inset-0 bg-gray-500 opacity-75'></div>
            </div>
            <span className='hidden sm:inline-block sm:align-middle sm:h-screen' aria-hidden='true'>
              &#8203;
            </span>
            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='sm:flex sm:items-start'>
                  <div className='mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                    <svg
                      className='h-6 w-6 text-red-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                      />
                    </svg>
                  </div>
                  <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left'>
                    <h3 className='text-lg leading-6 font-medium text-gray-900'>Delete Account</h3>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        Are you sure you want to delete user{' '}
                        <span className='font-medium'>{userData?.username}</span>? This action
                        cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm'
                  onClick={() => pendingAction && pendingAction()}>
                  Delete
                </button>
                <button
                  type='button'
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                  onClick={() => setShowConfirmation(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Change Modal */}
      {showVisibilityModal && pendingVisibility && (
        <div className='fixed z-10 inset-0 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div className='fixed inset-0 transition-opacity' aria-hidden='true'>
              <div className='absolute inset-0 bg-gray-500 opacity-75'></div>
            </div>
            <span className='hidden sm:inline-block sm:align-middle sm:h-screen' aria-hidden='true'>
              &#8203;
            </span>
            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='sm:flex sm:items-start'>
                  <div className='mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10'>
                    <svg
                      className='h-6 w-6 text-blue-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left'>
                    <h3 className='text-lg leading-6 font-medium text-gray-900'>
                      Change Profile Visibility
                    </h3>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        Are you sure you want to change your profile visibility to{' '}
                        <span className='font-medium'>{pendingVisibility}</span>?
                      </p>
                      <div className='mt-2 p-3 bg-blue-50 rounded-md text-sm text-blue-700'>
                        {pendingVisibility === 'public'
                          ? 'When set to public, other users can add you as a friend without requiring your approval.'
                          : 'When set to private, users must send friend requests that you need to approve.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm'
                  onClick={() => handleUpdateProfileVisibility(pendingVisibility)}>
                  Confirm Change
                </button>
                <button
                  type='button'
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                  onClick={() => {
                    setShowVisibilityModal(false);
                    setPendingVisibility(null);
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
