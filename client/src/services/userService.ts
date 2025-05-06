import axios from 'axios';
import {
  UserCredentials,
  SafeDatabaseUser,
  PrivacySettings,
} from '../types/types';
import api from './config';

const USER_API_URL = `${process.env.REACT_APP_SERVER_URL}/user`;

interface SpotifyTokens {
  username: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUsers = async (): Promise<SafeDatabaseUser[]> => {
  const res = await api.get(`${USER_API_URL}/getUsers`);
  if (res.status !== 200) {
    throw new Error('Error when fetching users');
  }
  return res.data;
};

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUserByUsername = async (
  username: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.get(`${USER_API_URL}/getUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching user');
  }
  return res.data;
};

/**
 * Sends a POST request to create a new user account.
 *
 * @param user - The user credentials (username and password) for signup.
 * @returns {Promise<User>} The newly created user object.
 * @throws {Error} If an error occurs during the signup process.
 */
const createUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/signup`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while signing up: ${error.response.data}`);
    } else {
      throw new Error('Error while signing up');
    }
  }
};

/**
 * Sends a POST request to authenticate a user.
 *
 * @param user - The user credentials (username and password) for login.
 * @returns {Promise<User>} The authenticated user object.
 * @throws {Error} If an error occurs during the login process.
 */
const loginUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/login`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while logging in: ${error.response.data}`);
    } else {
      throw new Error('Error while logging in');
    }
  }
};

/**
 * Deletes a user by their username.
 * @param username - The unique username of the user
 * @returns A promise that resolves to the deleted user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const deleteUser = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.delete(`${USER_API_URL}/deleteUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when deleting user');
  }
  return res.data;
};

/**
 * Resets the password for a user.
 * @param username - The unique username of the user
 * @param newPassword - The new password to be set for the user
 * @returns A promise that resolves to the updated user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const resetPassword = async (
  username: string,
  newPassword: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/resetPassword`, {
    username,
    password: newPassword,
  });
  if (res.status !== 200) {
    throw new Error('Error when resetting password');
  }
  return res.data;
};

/**
 * Updates the user's biography.
 * @param username The unique username of the user
 * @param newBiography The new biography to set for this user
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateBiography = async (
  username: string,
  newBiography: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateBiography`, {
    username,
    biography: newBiography,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating biography');
  }
  return res.data;
};

/**
 * Fetches mutual friends between the logged-in user and the profile being viewed.
 *
 * @param req The request containing the usernames of the logged-in user and the profile being viewed.
 * @returns {Promise<SafeDatabaseUser[]>} A list of mutual friends or an error
 */
const getMutualFriends = async (
  username: string,
  viewedUser: string,
): Promise<SafeDatabaseUser[]> => {
  const res = await api.get(
    `${process.env.REACT_APP_SERVER_URL}/friend/mutual/${username}/${viewedUser}`,
  );
  if (res.status !== 200) {
    throw new Error('Error when fetching mutual friends');
  }
  return res.data;
};

/**
 * Updates the Spotify tokens for a user in the database.
 * @param data Object containing username and Spotify tokens
 * @returns The updated user object
 */
const updateSpotifyTokens = async (
  data: SpotifyTokens,
): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/spotify/tokens`, data);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error updating Spotify tokens: ${error.response.data}`);
    }
    throw new Error('Error updating Spotify tokens');
  }
};

const updatePrivacySettings = async (
  username: string,
  settings: PrivacySettings,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updatePrivacySettings`, {
    username,
    privacySettings: settings,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating privacy settings');
  }
  return res.data;
};

/**
 * Updates the user's online status.
 * @param username - The unique username of the user
 * @param status - One of: 'online' | 'away' | 'busy' | 'invisible'
 * @param busySettings - Optional: muteScope ('friends-only' | 'everyone') for busy status
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const setUserStatus = async (
  username: string,
  status: 'online' | 'away' | 'busy' | 'invisible',
  busySettings?: { muteScope: 'friends-only' | 'everyone' },
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateOnlineStatus`, {
    username,
    onlineStatus: {
      status,
      ...(status === 'busy' ? { busySettings } : {}),
    },
  });

  if (res.status !== 200) {
    throw new Error('Error when updating status');
  }

  return res.data;
};

/**
 * Blocks a user by adding them to the blocker's blockedUsers array.
 * @param username - Username of the user performing the block
 * @param userToBlock - Username of the user being blocked
 * @returns Promise resolving to the updated user
 */
const blockUser = async (
  username: string,
  userToBlock: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.post(`${USER_API_URL}/block`, {
    username,
    userToBlock,
  });

  if (res.status !== 200) {
    throw new Error('Error when blocking user');
  }

  return res.data;
};

/**
 * Unblocks a user by removing them from the blocker's blockedUsers array.
 * @param username - Username of the user performing the unblock
 * @param userToUnblock - Username of the user being unblocked
 * @returns Promise resolving to the updated user
 */
const unblockUser = async (
  username: string,
  userToUnblock: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.post(`${USER_API_URL}/unblock`, {
    username,
    userToBlock: userToUnblock,
  });

  if (res.status !== 200) {
    throw new Error('Error when unblocking user');
  }

  return res.data;
};

/**
 * Checks if a user is blocked by the current user.
 * @param currentUser - The current user object
 * @param usernameToCheck - Username to check if blocked
 * @returns Boolean indicating if the user is blocked
 */
const isUserBlocked = (
  currentUser: SafeDatabaseUser,
  usernameToCheck: string,
): boolean => currentUser.blockedUsers?.includes(usernameToCheck) || false;

export {
  getUsers,
  getUserByUsername,
  loginUser,
  createUser,
  deleteUser,
  resetPassword,
  updateBiography,
  getMutualFriends,
  updateSpotifyTokens,
  updatePrivacySettings,
  setUserStatus,
  blockUser,
  unblockUser,
  isUserBlocked,
};
