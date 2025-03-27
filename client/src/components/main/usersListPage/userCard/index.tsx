import React, { useState, useEffect } from 'react';
import './index.css';
import { SafeDatabaseUser } from '../../../../types/types';
import {
  sendFriendRequest,
  getFriendRequests,
  updateFriendRequestStatus,
} from '../../../../services/friendService';
import useUserContext from '../../../../hooks/useUserContext';

/**
 * Interface representing the props for the User component.
 *
 * user - The user object containing details about the user.
 * handleUserCardViewClickHandler - The function to handle the click event on the user card.
 */
interface UserProps {
  user: SafeDatabaseUser;
  handleUserCardViewClickHandler: (user: SafeDatabaseUser) => void;
}

/**
 * User component renders the details of a user including its username and dateJoined.
 * It provides different UI options based on the friendship status.
 */
const UserCardView = (props: UserProps) => {
  const { user, handleUserCardViewClickHandler } = props;
  const { user: currentUser } = useUserContext();
  const [friendshipStatus, setFriendshipStatus] = useState<
    'none' | 'sent' | 'received' | 'friends'
  >('none');
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Check friendship status on component mount
  useEffect(() => {
    if (currentUser.username && user.username) {
      const checkFriendshipStatus = async () => {
        try {
          const requests = await getFriendRequests(currentUser.username);

          // Find any request between these users
          const existingRequest = requests.find(
            (req) =>
              (req.requester.username === currentUser.username &&
                req.recipient.username === user.username) ||
              (req.requester.username === user.username &&
                req.recipient.username === currentUser.username),
          );

          if (existingRequest) {
            // Store the request ID for accept/reject actions
            setPendingRequestId(existingRequest._id.toString());

            if (existingRequest.status === 'pending') {
              if (existingRequest.requester.username === currentUser.username) {
                setFriendshipStatus('sent');
              } else {
                setFriendshipStatus('received');
              }
            } else if (existingRequest.status === 'accepted') {
              setFriendshipStatus('friends');
            }
          }
        } catch (error) {
          console.error('Error checking friendship status:', error);
          setStatusMessage('Error checking friendship status');
        }
      };

      checkFriendshipStatus();
    }
  }, [currentUser.username, user.username]);

  // Handle sending a friend request
  const handleAddFriend = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await sendFriendRequest(currentUser.username, user.username);
      setFriendshipStatus('sent');
      setStatusMessage('Friend request sent');
    } catch (error) {
      console.error('Error sending friend request:', error);
      setStatusMessage('Failed to send request');
    }
  };

  // Handle accepting a friend request
  const handleAcceptRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!pendingRequestId) {
      setStatusMessage('Error: No pending request found');
      return;
    }

    try {
      await updateFriendRequestStatus(pendingRequestId, 'accepted');
      setFriendshipStatus('friends');
      setStatusMessage('Friend request accepted');
    } catch (error) {
      console.error('Error accepting request:', error);
      setStatusMessage('Failed to accept request');
    }
  };

  // Don't show action buttons for yourself
  const isCurrentUser = currentUser.username === user.username;

  // Render the appropriate button based on friendship status
  const renderActionButton = () => {
    if (isCurrentUser) {
      return null;
    }

    switch (friendshipStatus) {
      case 'none':
        return (
          <button className="friend-request-button" onClick={handleAddFriend}>
            Add Friend
          </button>
        );

      case 'sent':
        return (
          <button className="friend-request-pending-button" disabled>
            Request Sent
          </button>
        );

      case 'received':
        return (
          <button
            className="friend-request-accept-button"
            onClick={handleAcceptRequest}
          >
            Accept Request
          </button>
        );

      case 'friends':
        return (
          <button
            className="view-profile-button"
            onClick={(e) => {
              e.stopPropagation();
              handleUserCardViewClickHandler(user);
            }}
          >
            View Profile
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="user-card-container">
      <div
        className="user right_padding"
        onClick={() => handleUserCardViewClickHandler(user)}
      >
        <div className="user_mid">
          <div className="userUsername">{user.username}</div>
        </div>
        <div className="userStats">
          <div>joined {new Date(user.dateJoined).toUTCString()}</div>
        </div>
      </div>

      {renderActionButton()}

      {statusMessage && (
        <div className="friend-status-message">{statusMessage}</div>
      )}
    </div>
  );
};

export default UserCardView;
