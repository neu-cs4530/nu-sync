import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserByUsername,
  deleteUser,
  resetPassword,
  updateBiography,
  getMutualFriends,
} from '../services/userService';
import { SafeDatabaseUser } from '../types/types';
import useUserContext from './useUserContext';
import { checkSpotifyStatus, disconnectAllSpotifyAccounts, getCurrentlyPlaying, getSpotifyConflictStatus } from '../services/spotifyService';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000';

// type for the currently playing song
type CurrentlyPlaying = {
  track: {
    name: string;
    artists: { name: string }[];
    external_urls: { spotify: string };
  };
  progress_ms: number;
  timestamp: number;
};

/**
 * A custom hook to encapsulate all logic/state for the ProfileSettings component.
 */
const useProfileSettings = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useUserContext();
  const [userData, setUserData] = useState<SafeDatabaseUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [editBioMode, setEditBioMode] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutualFriends, setMutualFriends] = useState<string[]>([]);
  const [mutualFriendsLoading, setMutualFriendsLoading] = useState(false);

  // For delete-user confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const [loggedInSpotify, setLoggedInSpotify] = useState(false);

  const [currentPlayingSong, setCurrentPlayingSong] = useState<CurrentlyPlaying | null>(null);
  const [isCurrentlyPlayingSong, setIsCurrentlyPlayingSong] = useState<boolean>(false);

  const [showSpotifyConflictModal, setShowSpotifyConflictModal] = useState(false);
  const [conflictSpotifyUserId, setConflictSpotifyUserId] = useState<string | null>(null);

  const canEditProfile =
    currentUser.username && userData?.username ? currentUser.username === userData.username : false;

    useEffect(() => {
      const fetchConflictStatus = async () => {
        if (!username) return;

        try {
          const { conflict, spotifyUserId } = await getSpotifyConflictStatus(username);
          if (conflict && spotifyUserId) {
            setConflictSpotifyUserId(spotifyUserId);
            setShowSpotifyConflictModal(true);
          }
        } catch (err) {
          // console.error('Error checking Spotify conflict status:', err);
        }
      };

      fetchConflictStatus();
    }, [username]);


    const handleUnlinkAllAndRetry = async () => {
      if (!conflictSpotifyUserId) {
        return;
      }

      try {
        await disconnectAllSpotifyAccounts(conflictSpotifyUserId);
        setShowSpotifyConflictModal(false);
      } catch (err) {
        setErrorMessage('Failed to unlink Spotify accounts.');
      }
    };
  
  useEffect(() => {
    if (!username) return undefined;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getUserByUsername(username);
        setUserData(data);
      } catch (error) {
        setErrorMessage('Error fetching user profile');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentSong = async () => {
      try {
        const currentlyPlaying = await getCurrentlyPlaying(username);
        const currentStatus = await checkSpotifyStatus(username);

        if (currentStatus.isConnected && currentlyPlaying.isPlaying) {
          setCurrentPlayingSong(currentlyPlaying);
          setIsCurrentlyPlayingSong(true);
        } else {
          setCurrentPlayingSong(null);
          setIsCurrentlyPlayingSong(false);
        }
      } catch (error) {
        setErrorMessage('Error fetching currently playing song');
        setIsCurrentlyPlayingSong(false);
      }
    };

    // automatically fetch the currently playing song every 'interval' seconds
    let interval: NodeJS.Timeout;

    fetchUserData().then(() => {
      fetchCurrentSong();
      interval = setInterval(() => {
        fetchCurrentSong();
      }, 10000);
    });

    return () => {
      clearInterval(interval);
      setCurrentPlayingSong(null);
      setIsCurrentlyPlayingSong(false);
    };
  }, [username]);

  // Fetch mutual friends only when viewing another user's profile
  useEffect(() => {
    if (!username || currentUser.username === username) return;

    const fetchMutualFriends = async () => {
      try {
        setMutualFriendsLoading(true);
        const friendsList: SafeDatabaseUser[] = await getMutualFriends(
          currentUser.username,
          username,
        );
        if ('error' in friendsList) {
          setErrorMessage("Couldn't fetch mutual friends.");
        }
        setMutualFriends(friendsList.map(friend => friend.username));
      } catch {
        setMutualFriends([]);
      } finally {
        setMutualFriendsLoading(false);
      }
    };

    fetchMutualFriends();
  }, [username, userData, currentUser.username]);

  /**
   * Toggles the visibility of the password fields.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  /**
   * Validate the password fields before attempting to reset.
   */
  const validatePasswords = () => {
    if (newPassword.trim() === '' || confirmNewPassword.trim() === '') {
      setErrorMessage('Please enter and confirm your new password.');
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  /**
   * Handler for resetting the password
   */
  const handleResetPassword = async () => {
    if (!username) return;
    if (!validatePasswords()) {
      return;
    }
    try {
      await resetPassword(username, newPassword);
      setSuccessMessage('Password reset successful!');
      setErrorMessage(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setErrorMessage('Failed to reset password.');
      setSuccessMessage(null);
    }
  };

  const handleUpdateBiography = async () => {
    if (!username) return;
    try {
      // Await the async call to update the biography
      const updatedUser = await updateBiography(username, newBio);

      // Ensure state updates occur sequentially after the API call completes
      await new Promise(resolve => {
        setUserData(updatedUser); // Update the user data
        setEditBioMode(false); // Exit edit mode
        resolve(null); // Resolve the promise
      });

      setSuccessMessage('Biography updated!');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to update biography.');
      setSuccessMessage(null);
    }
  };

  /**
   * Handler for deleting the user (triggers confirmation modal)
   */
  const handleDeleteUser = () => {
    if (!username) return;
    setShowConfirmation(true);
    setPendingAction(() => async () => {
      try {
        await deleteUser(username);
        setSuccessMessage(`User "${username}" deleted successfully.`);
        setErrorMessage(null);
        navigate('/');
      } catch (error) {
        setErrorMessage('Failed to delete user.');
        setSuccessMessage(null);
      } finally {
        setShowConfirmation(false);
      }
    });
  };

  // handle logging a user into spotify
  const handleLoginUserSpotify = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setErrorMessage('Please log in first');
      return;
    }

    const user = JSON.parse(storedUser);
    try {
      // store url to return to after spotify login
      localStorage.setItem('spotify_return_url', window.location.pathname);
      window.location.href = `${SERVER_URL}/spotify/auth/spotify?username=${user.username}`;
    } catch (error) {
      setErrorMessage('Failed to log into Spotify');
    }
  };

  return {
    loggedInSpotify,
    setLoggedInSpotify,
    handleLoginUserSpotify,
    userData,
    newPassword,
    confirmNewPassword,
    setNewPassword,
    setConfirmNewPassword,
    loading,
    editBioMode,
    setEditBioMode,
    newBio,
    setNewBio,
    successMessage,
    errorMessage,
    showConfirmation,
    setShowConfirmation,
    pendingAction,
    setPendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    handleResetPassword,
    handleUpdateBiography,
    handleDeleteUser,
    mutualFriends,
    mutualFriendsLoading,
    currentPlayingSong,
    isCurrentlyPlayingSong,
    setCurrentPlayingSong,
    setIsCurrentlyPlayingSong,
    showSpotifyConflictModal,
    setShowSpotifyConflictModal,
    handleUnlinkAllAndRetry,
  };
};

export default useProfileSettings;
