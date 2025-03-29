import React from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { FriendConnection } from '../../../../types/types';

/**
 * Interface representing the props for the FriendCard component.
 * friend - The friend object containing friend details.
 * handleFriendSelect - Optional function to handle friend selection for messaging.
 */
interface FriendCardProps {
  friend: FriendConnection;
  handleFriendSelect?: (username: string) => void;
}

/**
 * FriendCard component displays information about a friend with action buttons.
 */
const FriendCard = ({ friend, handleFriendSelect }: FriendCardProps) => {
  const navigate = useNavigate();

  // Navigate to the friend's profile
  const handleViewProfile = () => {
    navigate(`/user/${friend.username}`);
  };

  // Send a message either via provided handler or direct navigation
  const handleSendMessage = () => {
    if (handleFriendSelect) {
      handleFriendSelect(friend.username);
    } else {
      navigate('/messaging/direct-message');
      localStorage.setItem('openChatWith', friend.username);
    }
  };

  return (
    <div className="friend-card">
      <div className="friend-info" onClick={handleViewProfile}>
        <div className="friend-username">{friend.username}</div>
      </div>

      <div className="friend-actions">
        <button
          className="send-message-button small-button"
          onClick={handleSendMessage}
        >
          Message
        </button>
      </div>
    </div>
  );
};

export default FriendCard;
