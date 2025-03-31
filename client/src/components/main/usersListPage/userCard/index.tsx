import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { SafeDatabaseUser } from '../../../../types/types';
import {
  sendFriendRequest,
  getFriendRequests,
  updateFriendRequestStatus,
  getMutualFriends,
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
  const navigate = useNavigate();
  const [friendshipStatus, setFriendshipStatus] = useState<
    'none' | 'sent' | 'received' | 'friends'
  >('none');
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mutualFriendsCount, setMutualFriendsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Format the date to a more readable format
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();

    // If the date is today, show as "Today"
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }

    // If the date is yesterday, show as "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // For other dates, show in a nice format
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
  };

  // Check friendship status and fetch mutual friends on component mount
  useEffect(() => {
    if (
      currentUser.username &&
      user.username &&
      currentUser.username !== user.username
    ) {
      setIsLoading(true);

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

              // Fetch mutual friends when they're friends
              try {
                const mutualFriends = await getMutualFriends(
                  currentUser.username,
                  user.username,
                );
                setMutualFriendsCount(mutualFriends.length);
              } catch (error) {
                console.error('Error fetching mutual friends:', error);
              }
            }
          } else {
            // If they're not friends, still check for mutual friends
            try {
              const mutualFriends = await getMutualFriends(
                currentUser.username,
                user.username,
              );
              setMutualFriendsCount(mutualFriends.length);
            } catch (error) {
              console.error('Error fetching mutual friends:', error);
            }
          }
        } catch (error) {
          setStatusMessage('Error checking friendship status');
        } finally {
          setIsLoading(false);
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
      setStatusMessage('Failed to accept request');
    }
  };

  // Handle sending a private message
  const handleSendMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem('openChatWith', user.username);
    navigate('/messaging/direct-message');
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
          <button className="send-message-button" onClick={handleSendMessage}>
            Send Message
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="user-card-container">
      <div
        className="user-card"
        onClick={() => handleUserCardViewClickHandler(user)}
      >
        <div className="user-info">
          <div className="user-name">{user.username}</div>
          <div className="user-details">
            {!isCurrentUser && mutualFriendsCount > 0 && (
              <span className="mutual-friends-label">
                {mutualFriendsCount} mutual{' '}
                {mutualFriendsCount === 1 ? 'friend' : 'friends'}
              </span>
            )}
            <span className="join-date">
              Joined {formatDate(user.dateJoined)}
            </span>
          </div>
        </div>

        <div className="user-actions">{renderActionButton()}</div>
      </div>

      {statusMessage && <div className="status-message">{statusMessage}</div>}
    </div>
  );
};

export default UserCardView;
