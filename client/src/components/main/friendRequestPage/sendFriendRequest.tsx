import React, { useState } from 'react';
import { sendFriendRequest } from '../../../services/friendService';
import useUserContext from '../../../hooks/useUserContext';
// import './index.css';

const SendFriendRequest = ({
  targetUsername,
  onRequestSent,
  buttonText = 'Send Friend Request',
  compact = false,
}: {
  targetUsername?: string;
  onRequestSent?: () => void;
  buttonText?: string;
  compact?: boolean;
}) => {
  const { user } = useUserContext();
  const [username, setUsername] = useState(targetUsername || '');
  const [showForm, setShowForm] = useState(!targetUsername || !compact);
  const [status, setStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const recipient = targetUsername || username;

    if (!recipient.trim()) {
      setStatus({ message: 'Please enter a username', isError: true });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      const result = await sendFriendRequest(user.username, recipient);

      if ('error' in result) {
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : 'An unknown error occurred';
        setStatus({
          message: errorMessage,
          isError: true,
        });
      } else {
        setStatus({
          message: `Friend request sent to ${recipient}`,
          isError: false,
        });
        if (!targetUsername) setUsername('');
        if (onRequestSent) onRequestSent();
      }
    } catch (err) {
      setStatus({ message: 'Failed to send friend request', isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Compact mode (just a button that triggers the action directly)
  if (compact && targetUsername && !showForm) {
    return (
      <button
        className="compact-friend-request-button"
        onClick={() => handleSubmit()}
        disabled={loading}
      >
        {loading ? 'Sending...' : buttonText}
      </button>
    );
  }

  // Full form mode
  return (
    <div className="send-request-container">
      {!targetUsername && <h3>Add a Friend</h3>}

      <form onSubmit={handleSubmit}>
        {!targetUsername && (
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            disabled={loading}
          />
        )}

        <button type="submit" disabled={loading} className="custom-button">
          {loading ? 'Sending...' : buttonText}
        </button>
      </form>

      {status && (
        <div
          className={`status-message ${status.isError ? 'error' : 'success'}`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
};

export default SendFriendRequest;
