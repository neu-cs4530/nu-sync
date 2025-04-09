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
import {
  blockUser,
  unblockUser,
  isUserBlocked,
} from '../../../../services/userService';

import useUserContext from '../../../../hooks/useUserContext';
import UserStatusIcon from '../../UserStatusIcon';

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
  const userIsBlocked = isUserBlocked(currentUser, user.username);

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();

    // Show today and yesterday instead of date
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }

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

  const handleBlockToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event from firing

    try {
      if (userIsBlocked) {
        // Unblock user
        await unblockUser(currentUser.username, user.username);
      } else {
        // Block user
        await blockUser(currentUser.username, user.username);
      }
      // The socket event will update the UI automatically
    } catch (err) {
      // eslint-disable-next-line
      console.error(
        `Failed to ${userIsBlocked ? 'unblock' : 'block'} user:`,
        err,
      );
    }
  };

  useEffect(() => {
    if (
      currentUser.username &&
      user.username &&
      currentUser.username !== user.username
    ) {
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
                // eslint-disable-next-line
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
              // eslint-disable-next-line
              console.error('Error fetching mutual friends:', error);
            }
          }
        } catch (error) {
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
      const result = await sendFriendRequest(
        currentUser.username,
        user.username,
      );

      // Check if the request was auto-accepted (meaning the user has a public profile)
      if (result.status === 'accepted') {
        setFriendshipStatus('friends');
        setStatusMessage('Friend added successfully');
      } else {
        setFriendshipStatus('sent');
        setStatusMessage('Friend request sent');
      }
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
            <span className="join-date">
              Joined: {formatDate(user.dateJoined)}
            </span>
            {mutualFriendsCount > 0 && (
              <span className="mutual-friends-label">
                {mutualFriendsCount} mutual friend
                {mutualFriendsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Only show actions if it's not the current user */}
        {!isCurrentUser && (
          <div className="user-actions">
            {renderActionButton()}
            <button
              className={userIsBlocked ? 'unblock-button' : 'block-button'}
              onClick={handleBlockToggle}
            >
              {userIsBlocked ? 'Unblock User' : 'Block User'}
            </button>
          </div>
        )}
      </div>
      {statusMessage && <div className="status-message">{statusMessage}</div>}
    </div>
  );
};

export default UserCardView;
