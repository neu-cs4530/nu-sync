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
    isCurrentlyPlayingSong,
    showSpotifyConflictModal,
    setShowSpotifyConflictModal,
    handleUnlinkAllAndRetry,
    friendList,
  } = useProfileSettings();

  const { isSpotifyConnected, spotifyUserId, disconnect } = useSpotifyAuth();

  useEffect(() => {}, [isSpotifyConnected, spotifyUserId]);

  if (loading) {
    return (
      <div className='page-container'>
        <div className='profile-card'>
          <h2>Loading user data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className='page-container'>
      <div className='profile-card'>
        <h2>Profile</h2>
        {successMessage && <p className='success-message'>{successMessage}</p>}
        {errorMessage && <p className='error-message'>{errorMessage}</p>}
        {userData ? (
          <>
            <h4>General Information</h4>
            <p>
              <strong>Username:</strong> {userData.username}{' '}
              <span style={{ marginLeft: '0.5rem' }}>
                <UserStatusIcon status={userData.onlineStatus?.status ?? 'online'} />
              </span>
            </p>

            {/* ---- Friends Section ---- */}
            <div className='friend-section'>
              <p>
                <strong>Friends:</strong>{' '}
                {friendList.length === 0
                  ? 'No friends yet.'
                  : friendList.map((f, i) => f.username).join(', ')}
              </p>
            </div>

            {/* ---- Mutual Friends Section ---- */}
            {!canEditProfile && (
              <div className='mutual-friends'>
                <p>
                  <strong>Mutual Friends:</strong> {mutualFriendsLoading && 'Loading...'}
                  {!mutualFriendsLoading &&
                    mutualFriends.length === 0 &&
                    'No mutual friends found.'}
                  {!mutualFriendsLoading && mutualFriends.length > 0 && mutualFriends.join(', ')}
                </p>
              </div>
            )}

            <div className='spotify-section'>
              <h3>Spotify Connection</h3>

              {canEditProfile ? (
                <>
                  {isSpotifyConnected ? (
                    <>
                      <p className='success-message'>Connected to Spotify!</p>
                      {spotifyUserId && <p>Spotify User ID: {spotifyUserId}</p>}
                      <button className='delete-button' onClick={disconnect}>
                        Disconnect Spotify
                      </button>
                    </>
                  ) : (
                    <>
                      <p>Not connected to Spotify</p>
                      <button className='login-button' onClick={handleLoginUserSpotify}>
                        Connect Spotify
                      </button>
                    </>
                  )}

                  {currentPlayingSong?.track ? (
                    <p>
                      Currently playing:{' '}
                      <a
                        href={currentPlayingSong.track.external_urls.spotify}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{ color: 'blue', textDecoration: 'underline' }}>
                        {currentPlayingSong.track.name} - {currentPlayingSong.track.artists[0].name}
                      </a>
                    </p>
                  ) : (
                    <p>No song is currently playing.</p>
                  )}
                </>
              ) : (
                <>
                  {isCurrentlyPlayingSong && currentPlayingSong ? (
                    <p>
                      Currently playing:{' '}
                      <a
                        href={currentPlayingSong.track.external_urls.spotify}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{ color: 'blue', textDecoration: 'underline' }}>
                        {currentPlayingSong.track.name} - {currentPlayingSong.track.artists[0].name}
                      </a>
                    </p>
                  ) : (
                    <p>No song is currently playing or Spotify data could not be retrieved.</p>
                  )}
                </>
              )}

              {showSpotifyConflictModal && (
                <SpotifyConflictModal
                  onConfirm={handleUnlinkAllAndRetry}
                  onCancel={() => setShowSpotifyConflictModal(false)}
                />
              )}
            </div>

            {/* ---- Biography Section ---- */}
            {!editBioMode && (
              <p>
                <strong>Biography:</strong> {userData.biography || 'No biography yet.'}
                {canEditProfile && (
                  <button
                    className='login-button'
                    style={{ marginLeft: '1rem' }}
                    onClick={() => {
                      setEditBioMode(true);
                      setNewBio(userData.biography || '');
                    }}>
                    Edit
                  </button>
                )}
              </p>
            )}

            {editBioMode && canEditProfile && (
              <div style={{ margin: '1rem 0' }}>
                <input
                  className='input-text'
                  type='text'
                  value={newBio}
                  onChange={e => setNewBio(e.target.value)}
                />
                <button
                  className='login-button'
                  style={{ marginLeft: '1rem' }}
                  onClick={handleUpdateBiography}>
                  Save
                </button>
                <button
                  className='delete-button'
                  style={{ marginLeft: '1rem' }}
                  onClick={() => setEditBioMode(false)}>
                  Cancel
                </button>
              </div>
            )}

            <p>
              <strong>Date Joined:</strong>{' '}
              {userData.dateJoined ? new Date(userData.dateJoined).toLocaleDateString() : 'N/A'}
            </p>

            {/* ---- Reset Password Section ---- */}
            {canEditProfile && (
              <>
                <h4>Reset Password</h4>
                <input
                  className='input-text'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='New Password'
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <input
                  className='input-text'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Confirm New Password'
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                />
                <button className='toggle-password-button' onClick={togglePasswordVisibility}>
                  {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                </button>
                <button className='login-button' onClick={handleResetPassword}>
                  Reset
                </button>
              </>
            )}

            {/* ---- Danger Zone ---- */}
            {canEditProfile && (
              <>
                <h4>Danger Zone</h4>
                <button className='delete-button' onClick={handleDeleteUser}>
                  Delete This User
                </button>
              </>
            )}
          </>
        ) : (
          <p>No user data found. Make sure the username parameter is correct.</p>
        )}

        {/* ---- Delete Confirmation Modal ---- */}
        {showConfirmation && (
          <div className='modal'>
            <div className='modal-content'>
              <p>
                Are you sure you want to delete user <strong>{userData?.username}</strong>? This
                action cannot be undone.
              </p>
              <button className='delete-button' onClick={() => pendingAction && pendingAction()}>
                Confirm
              </button>
              <button className='cancel-button' onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
