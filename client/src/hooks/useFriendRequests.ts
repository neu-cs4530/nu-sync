import { useState, useEffect } from 'react';
import useUserContext from './useUserContext';
import {
  DatabaseFriendRequest,
  FriendRequestUpdatePayload,
} from '../types/types';
import {
  getFriendRequests,
  getPendingRequests,
  updateFriendRequestStatus,
  deleteFriendRequest,
} from '../services/friendService';

/**
 * Custom hook for managing friend requests
 * Handles fetching, accepting, rejecting, and real-time updates
 */
const useFriendRequests = () => {
  const { user, socket } = useUserContext();

  const [allRequests, setAllRequests] = useState<DatabaseFriendRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<
    DatabaseFriendRequest[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Function to fetch friend requests and update state
     */
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all requests for the current user
        if (user.username) {
          const requests = await getFriendRequests(user.username);
          setAllRequests(requests);

          // Fetch pending requests for the current user
          const pending = await getPendingRequests(user.username);
          setPendingRequests(pending);
        }
      } catch (err) {
        setError('Failed to load friend requests');
        // eslint-disable-next-line no-console
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    /**
     * Function to handle friend request updates from socket
     * @param payload The update payload from the socket
     */
    const handleFriendRequestUpdate = (payload: FriendRequestUpdatePayload) => {
      const { friendRequest, type } = payload;

      switch (type) {
        case 'created':
          // Add to all requests list
          setAllRequests((prev) => [friendRequest, ...prev]);

          // Add to pending if user is recipient and status is pending
          if (
            friendRequest.status === 'pending' &&
            friendRequest.recipient.username === user.username
          ) {
            setPendingRequests((prev) => [friendRequest, ...prev]);
          }
          break;

        case 'updated':
          // Update in all requests list
          setAllRequests((prev) =>
            prev.map((req) =>
              req._id === friendRequest._id ? friendRequest : req,
            ),
          );

          // Update in pending list (add/update if pending, remove if not)
          if (
            friendRequest.status === 'pending' &&
            friendRequest.recipient.username === user.username
          ) {
            // Check if it exists in pending list
            const existsInPending = pendingRequests.some(
              (req) => req._id === friendRequest._id,
            );

            if (existsInPending) {
              // Update existing request
              setPendingRequests((prev) =>
                prev.map((req) =>
                  req._id === friendRequest._id ? friendRequest : req,
                ),
              );
            } else {
              // Add to pending list
              setPendingRequests((prev) => [...prev, friendRequest]);
            }
          } else {
            // Remove from pending list
            setPendingRequests((prev) =>
              prev.filter((req) => req._id !== friendRequest._id),
            );
          }
          break;

        case 'deleted':
          // Remove from both lists
          setAllRequests((prev) =>
            prev.filter((req) => req._id !== friendRequest._id),
          );
          setPendingRequests((prev) =>
            prev.filter((req) => req._id !== friendRequest._id),
          );
          break;

        default:
          // Handle unknown update types
          // eslint-disable-next-line no-console
          console.log(`Unknown friend request update type: ${type}`);
      }
    };

    // Fetch data when component mounts
    fetchRequests();

    // Set up socket listener for friend request updates
    socket.on('friendRequestUpdate', handleFriendRequestUpdate);

    // Clean up socket listener when component unmounts
    return () => {
      socket.off('friendRequestUpdate', handleFriendRequestUpdate);
    };
  }, [socket, user.username, pendingRequests]);

  /**
   * Accept a friend request
   * @param requestId The ID of the request to accept
   */
  const acceptRequest = async (requestId: string) => {
    try {
      setError(null);
      await updateFriendRequestStatus(requestId, 'accepted');
      // UI will update via socket event
    } catch (err) {
      setError('Failed to accept friend request');
      // eslint-disable-next-line no-console
      console.log(err);
    }
  };

  /**
   * Reject a friend request
   * @param requestId The ID of the request to reject
   */
  const rejectRequest = async (requestId: string) => {
    try {
      setError(null);
      await updateFriendRequestStatus(requestId, 'rejected');
      // UI will update via socket event
    } catch (err) {
      setError('Failed to reject friend request');
      // eslint-disable-next-line no-console
      console.log(err);
    }
  };

  /**
   * Delete a friend request
   * @param requestId The ID of the request to delete
   */
  const removeRequest = async (requestId: string) => {
    try {
      setError(null);
      await deleteFriendRequest(requestId);
      // UI will update via socket event
    } catch (err) {
      setError('Failed to delete friend request');
      // eslint-disable-next-line no-console
      console.log(err);
    }
  };

  return {
    allRequests,
    pendingRequests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    removeRequest,
  };
};

export default useFriendRequests;
