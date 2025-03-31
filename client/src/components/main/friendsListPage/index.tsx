import React, { useEffect, useState, useCallback } from 'react';
import './index.css';
import { getFriends } from '../../../services/friendService';
import useUserContext from '../../../hooks/useUserContext';
import FriendCard from './friendCard';
import {
  FriendConnection,
  FriendRequestUpdatePayload,
} from '../../../types/types';

/**
 * Interface representing the props for the FriendsListPage component.
 * handleFriendSelect - Optional function to handle friend selection for messaging.
 */
interface FriendsListPageProps {
  handleFriendSelect?: (username: string) => void;
}

/**
 * FriendsListPage component displays a list of the current user's friends
 * with options to view their profile or send them messages.
 */
const FriendsListPage = ({ handleFriendSelect }: FriendsListPageProps) => {
  const { user, socket } = useUserContext();
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!user.username) return;

    try {
      setLoading(true);
      const friendsList = await getFriends(user.username);
      setFriends(friendsList);
    } catch (err) {
      setError('Failed to load friends list');
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  }, [user.username]);

  useEffect(() => {
    fetchFriends();

    // Listen for friend request updates via socket
    const handleFriendRequestUpdate = (payload: FriendRequestUpdatePayload) => {
      const { friendRequest, type } = payload;

      // If a friend request was deleted or updated, refresh the friend list
      if (
        (type === 'deleted' || type === 'updated') &&
        (friendRequest.requester.username === user.username ||
          friendRequest.recipient.username === user.username)
      ) {
        fetchFriends();
      }
    };

    socket.on('friendRequestUpdate', handleFriendRequestUpdate);

    return () => {
      socket.off('friendRequestUpdate', handleFriendRequestUpdate);
    };
  }, [user.username, socket, fetchFriends]);

  const handleFriendRemoved = (friendId: string) => {
    setFriends((prevFriends) =>
      prevFriends.filter((friend) => friend._id.toString() !== friendId),
    );
  };

  if (loading) {
    return <div className="loading-indicator">Loading friends...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (friends.length === 0) {
    return (
      <div className="empty-state">
        <p>You don`&apos;`t have any friends yet.</p>
        <p>Add friends to start messaging!</p>
      </div>
    );
  }

  return (
    <div className="friend-list-container">
      <h3>Your Friends</h3>
      <div className="friend-list">
        {friends.map((friend) => (
          <FriendCard
            key={friend._id.toString()}
            friend={friend}
            handleFriendSelect={handleFriendSelect}
            onFriendRemoved={handleFriendRemoved}
          />
        ))}
      </div>
    </div>
  );
};

export default FriendsListPage;
