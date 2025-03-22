import { ObjectId } from 'mongodb';
import {
  DatabaseFriendRequest,
  FriendConnection,
  SafeDatabaseUser,
} from '../types/types';
import api from './config';

const FRIEND_API_URL = `${process.env.REACT_APP_SERVER_URL}/friend`;

/**
 * Function to get friend requests
 *
 * @throws Error if there is an issue fetching friend requests.
 */
const getFriendRequests = async (
  username: string,
): Promise<DatabaseFriendRequest[]> => {
  const res = await api.get(`${FRIEND_API_URL}/requests/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching friend requests');
  }
  return res.data;
};

/**
 * Function to get pending friend requests
 *
 * @throws Error if there is an issue fetching pending requests.
 */
const getPendingRequests = async (
  username: string,
): Promise<DatabaseFriendRequest[]> => {
  const res = await api.get(`${FRIEND_API_URL}/requests/pending/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching pending requests');
  }
  return res.data;
};

/**
 * Function to get friends of a certain user
 *
 * @throws Error if there is an issue fetching friends.
 */
const getFriends = async (username: string): Promise<FriendConnection[]> => {
  const res = await api.get(`${FRIEND_API_URL}/friends/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching friends');
  }
  return res.data;
};

/**
 * Function to send a friend request from one user to another
 *
 * @param requester - The username of the user sending the request
 * @param recipient - The username of the user receiving the request
 *
 * @throws Error if there is an issue sending the friend request
 */
const sendFriendRequest = async (
  requester: string,
  recipient: string,
): Promise<DatabaseFriendRequest> => {
  const res = await api.post(`${FRIEND_API_URL}/request`, {
    requester,
    recipient,
  });
  if (res.status !== 201) {
    throw new Error('Error when sending friend request');
  }
  return res.data;
};

/**
 * Function to update the status of a friend request (accept/reject)
 *
 * @param requestId - The ID of the friend request
 * @param status - The new status ('accepted' or 'rejected')
 * @throws Error if there is an issue updating the friend request
 */
const updateFriendRequestStatus = async (
  requestId: string,
  status: 'accepted' | 'rejected',
): Promise<DatabaseFriendRequest> => {
  const res = await api.put(`${FRIEND_API_URL}/request/status`, {
    requestId,
    status,
  });
  if (res.status !== 200) {
    throw new Error(
      `Error when ${status === 'accepted' ? 'accepting' : 'rejecting'} friend request`,
    );
  }
  return res.data;
};

/**
 * Function to delete a friend request
 *
 * @param requestId - The ID of the friend request to delete
 * @throws Error if there is an issue deleting the friend request
 */
const deleteFriendRequest = async (
  requestId: string,
): Promise<DatabaseFriendRequest> => {
  const res = await api.delete(`${FRIEND_API_URL}/request/${requestId}`);
  if (res.status !== 200) {
    throw new Error('Error when deleting friend request');
  }
  return res.data;
};

/**
 * Function to get mutual friends between two users
 *
 * @param username1 - The username of the first user
 * @param username2 - The username of the second user
 * @throws Error if there is an issue fetching mutual friends
 */
const getMutualFriends = async (
  username1: string,
  username2: string,
): Promise<SafeDatabaseUser[]> => {
  const res = await api.get(
    `${FRIEND_API_URL}/mutual/${username1}/${username2}`,
  );
  if (res.status !== 200) {
    throw new Error('Error when fetching mutual friends');
  }
  return res.data;
};

export {
  getFriendRequests,
  getPendingRequests,
  getFriends,
  sendFriendRequest,
  updateFriendRequestStatus,
  deleteFriendRequest,
  getMutualFriends,
};
