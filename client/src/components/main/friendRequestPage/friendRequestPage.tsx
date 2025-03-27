import React, { useState } from 'react';
import FriendRequestCard from './friendRequestCard';
import useFriendRequests from '../../../hooks/useFriendRequests';
// import './index.css';

const FriendRequestPage = () => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>(
    'incoming',
  );
  const {
    allRequests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    removeRequest,
  } = useFriendRequests();

  // Filter for incoming and outgoing requests
  const incomingRequests = allRequests.filter(
    (req) =>
      req.status === 'pending' &&
      req.recipient.username !== req.requester.username,
  );

  const outgoingRequests = allRequests.filter(
    (req) =>
      req.status === 'pending' &&
      req.requester.username === req.recipient.username,
  );

  if (loading) {
    return <div className="loading">Loading friend requests...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Render appropriate request list based on active tab
  const renderRequestList = () => {
    if (activeTab === 'incoming') {
      if (incomingRequests.length === 0) {
        return <p className="no-requests">No incoming friend requests.</p>;
      }

      return incomingRequests.map((request) => (
        <FriendRequestCard
          key={request._id.toString()}
          request={request}
          onAccept={() => acceptRequest(request._id.toString())}
          onReject={() => rejectRequest(request._id.toString())}
        />
      ));
    }
    if (outgoingRequests.length === 0) {
      return <p className="no-requests">No outgoing friend requests.</p>;
    }

    return outgoingRequests.map((request) => (
      <FriendRequestCard
        key={request._id.toString()}
        request={request}
        isOutgoing={true}
        onCancel={() => removeRequest(request._id.toString())}
      />
    ));
  };

  return (
    <div className="friend-requests-page">
      <h1>Friend Requests</h1>

      <div className="friend-requests-container">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'incoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('incoming')}
          >
            Incoming ({incomingRequests.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'outgoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('outgoing')}
          >
            Outgoing ({outgoingRequests.length})
          </button>
        </div>

        <div className="requests-list">{renderRequestList()}</div>
      </div>
    </div>
  );
};

export default FriendRequestPage;
