import React, { useEffect, useState } from 'react';
import './index.css';
import { getFriends } from '../../../services/friendService';
import useUserContext from '../../../hooks/useUserContext';
import FriendCard from './friendCard';
import { FriendConnection } from '../../../types/types';

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
  const { user } = useUserContext();
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user.username) return;

      try {
        setLoading(true);
        const friendsList = await getFriends(user.username);
        setFriends(friendsList);
      } catch (err) {
        console.error('Error fetching friends:', err);
        setError('Failed to load friends list');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [user.username]);

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
          />
        ))}
      </div>
    </div>
  );
};

export default FriendsListPage;
