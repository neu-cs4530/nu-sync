import React from 'react';
import { DatabaseFriendRequest } from '../../../types/types';
import './friendRequestPage.css';

/**
 * FriendRequestCard component displays a single friend request with action buttons.
 */
const FriendRequestCard = ({
  request,
  onAccept,
  onReject,
  onCancel,
  isOutgoing = false,
}: {
  request: DatabaseFriendRequest;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  isOutgoing?: boolean;
}) => {
  // Determine which user to display based on whether it's incoming or outgoing
  const displayUser = isOutgoing ? request.recipient : request.requester;
  const { username } = displayUser;

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  return (
    <div className="friend-card">
      <div className="request-user-info">
        <h3>{username}</h3>
        <p className="request-date">
          Requested {formatDate(request.requestedAt)}
        </p>
      </div>

      <div className="request-actions">
        {!isOutgoing && (
          <>
            <button className="custom-button accept-button" onClick={onAccept}>
              Accept
            </button>
            <button className="custom-button reject-button" onClick={onReject}>
              Reject
            </button>
          </>
        )}

        {isOutgoing && (
          <button className="custom-button cancel-button" onClick={onCancel}>
            Cancel Request
          </button>
        )}
      </div>
    </div>
  );
};

export default FriendRequestCard;
