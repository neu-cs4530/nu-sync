import './index.css';
import { useEffect, useState } from 'react';
import useUserContext from '../../../hooks/useUserContext';
import useDirectMessage from '../../../hooks/useDirectMessage';
import ChatsListCard from './chatsListCard';
import FriendsListPage from '../friendsListPage';
import MessageCard from '../messageCard';
import SearchResultCard from './searchResultCard';

/**
 * DirectMessage component renders a page for direct messaging between users.
 * It includes a list of users and a chat window to send and receive messages.
 */
const DirectMessage = () => {
  const { user } = useUserContext();

  const {
    selectedChat,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleDirectChatWithFriend,
    handleUserSelect,
    handleCreateChat,
    handleSendSpotifyPlaylist,
    showPlaylistDropdown,
    playlists,
    selectedPlaylist,
    setSelectedPlaylist,
    fetchSpotifyPlaylists,
    error,
    searchTerm,
    setSearchTerm,
    searchResults,
    searchError,
    handleSearch,
    handleSearchResultClick,
    highlightedMessageId,
    messageRefs,
  } = useDirectMessage();

  // const handleSendSpotifyPlaylist = useSpotifyAuth()

  useEffect(() => {
    const userToChat = localStorage.getItem('openChatWith');
    if (userToChat) {
      // Remove from localStorage immediately
      localStorage.removeItem('openChatWith');

      handleDirectChatWithFriend(userToChat);
    }
  }, [handleDirectChatWithFriend]);

  return (
    <>
      <div className="create-panel">
        <button
          className="custom-button"
          onClick={() => setShowCreatePanel((prev) => !prev)}
        >
          {showCreatePanel ? 'Hide Create Chat Panel' : 'Start a Chat'}
        </button>
        {error && <div className="direct-message-error">{error}</div>}
        {showCreatePanel && (
          <>
            <p>Chat with your friends</p>
            <FriendsListPage handleFriendSelect={handleDirectChatWithFriend} />
          </>
        )}
      </div>

      <div className="direct-message-container">
        <div className="chgiats-list">
          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="custom-input"
            />
            <button type="submit" className="custom-button">
              Search
            </button>
          </form>

          {searchError && <div className="error">{searchError}</div>}

          {/* search results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <p>
                Found {searchResults.length} result
                {searchResults.length > 1 ? 's' : ''} for &quot;
                {searchTerm}&quot;
              </p>
              <ul>
                {searchResults.map((result) => (
                  <SearchResultCard
                    key={String(result._id)}
                    result={result}
                    handleClick={() => handleSearchResultClick(result)}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* chat list */}
          {chats.map((chat) => (
            <ChatsListCard
              key={String(chat._id)}
              chat={chat}
              handleChatSelect={handleChatSelect}
            />
          ))}
        </div>

        <div className="chat-container">
          {selectedChat ? (
            <>
              <h2>Chat Participants: {selectedChat.participants.join(', ')}</h2>
              <div className="chat-messages">
                {selectedChat.messages.map((message) => (
                  <div
                    key={String(message._id)}
                    ref={(el) => {
                      messageRefs.current[String(message._id)] = el;
                    }}
                    className={`message-wrapper${
                      highlightedMessageId?.toString() === String(message._id)
                        ? ' highlight'
                        : ''
                    }`}
                  >
                    <MessageCard message={message} />
                  </div>
                ))}
              </div>
              <div className="message-input">
                <input
                  className="custom-input"
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button className="custom-button" onClick={handleSendMessage}>
                  Send
                </button>

                {/* Spotify Playlist Dropdown */}
                <button className='custom-button' onClick={fetchSpotifyPlaylists}>
                  Share Spotify Playlist
                </button>

                {showPlaylistDropdown && (
                  <>
                    <div className="playlist-dropdown">
                      <select
                        onChange={(e) => {
                          const playlist = playlists?.find(
                            (p) => p.id === e.target.value,
                          );
                          setSelectedPlaylist(playlist || null);
                        }}
                      >
                        {playlists?.map((playlist) => (
                          <option key={playlist.id} value={playlist.id}>
                            {playlist.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="custom-button"
                      onClick={handleSendSpotifyPlaylist}
                      disabled={!selectedPlaylist}
                    >
                      Send Playlist
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <h2>Select a user to start chatting</h2>
          )}
        </div>
      </div>
    </>
  );
};

export default DirectMessage;
