import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { FriendConnection } from '../../../../types/types';
import { deleteFriendRequest } from '../../../../services/friendService';

/**
 * Interface representing the props for the FriendCard component.
 * friend - The friend object containing friend details.
 * handleFriendSelect - Optional function to handle friend selection for messaging.
 */
interface FriendCardProps {
  friend: FriendConnection;
  handleFriendSelect?: (username: string) => void;
  onFriendRemoved?: (friendId: string) => void;
}

/**
 * FriendCard component displays information about a friend with action buttons.
 */
const FriendCard = ({
  friend,
  handleFriendSelect,
  onFriendRemoved,
}: FriendCardProps) => {
  const navigate = useNavigate();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);

  // Navigate to the friend's profile
  const handleViewProfile = () => {
    navigate(`/user/${friend.username}`);
  };

  // Send a message either via provided handler or direct navigation
  const handleSendMessage = () => {
    if (handleFriendSelect) {
      handleFriendSelect(friend.username);
    } else {
      localStorage.setItem('openChatWith', friend.username);
      navigate('/messaging/direct-message');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      setIsRemoving(true);
      setError(null);

      // The requestId is stored in the friend object
      await deleteFriendRequest(friend.requestId.toString());

      if (onFriendRemoved) {
        onFriendRemoved(friend._id.toString());
      }
    } catch (err) {
      setError('Failed to remove friend');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="friend-card">
      <div className="friend-info" onClick={handleViewProfile}>
        <div className="friend-username">{friend.username}</div>
      </div>

      {!showRemoveConfirmation ? (
        <div className="friend-actions">
          <button
            className="send-message-button small-button"
            onClick={handleSendMessage}
          >
            Message
          </button>
          <button
            className="remove-friend-button small-button"
            onClick={() => setShowRemoveConfirmation(true)}
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="friend-actions-confirmation">
          <span className="confirmation-text">Confirm?</span>
          <div className="confirmation-buttons">
            <button
              className="confirm-yes-button small-button"
              onClick={handleRemoveFriend}
              disabled={isRemoving}
            >
              {isRemoving ? '...' : 'Yes'}
            </button>
            <button
              className="confirm-no-button small-button"
              onClick={() => setShowRemoveConfirmation(false)}
              disabled={isRemoving}
            >
              No
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default FriendCard;
