import './index.css';
import useDirectMessage from '../../../hooks/useDirectMessage';
import ChatsListCard from './chatsListCard';
import UsersListPage from '../usersListPage';
import MessageCard from '../messageCard';
import SearchResultCard from './searchResultCard';
import SpotifySharingComponent from './spotifySharing';

const DirectMessage = () => {
  const {
    selectedChat,
    chatToCreate,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateChat,
    searchTerm,
    setSearchTerm,
    searchResults,
    searchError,
    handleSearch,
    handleSearchResultClick,
    highlightedMessageId,
    messageRefs,
    error,
    spotifySharing,
  } = useDirectMessage();

  return (
    <>
      <div className='create-panel'>
        <button className='custom-button' onClick={() => setShowCreatePanel(prev => !prev)}>
          {showCreatePanel ? 'Hide Create Chat Panel' : 'Start a Chat'}
        </button>
        {error && <div className='direct-message-error'>{error}</div>}
        {showCreatePanel && (
          <>
            <p>Selected user: {chatToCreate}</p>
            <button className='custom-button' onClick={handleCreateChat}>
              Create New Chat
            </button>
            <UsersListPage handleUserSelect={handleUserSelect} />
          </>
        )}
      </div>

      <div className='direct-message-container'>
        <div className='chats-list'>
          <form onSubmit={handleSearch} className='search-bar'>
            <input
              type='text'
              placeholder='Search messages...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='custom-input'
            />
            <button type='submit' className='custom-button'>
              Search
            </button>
          </form>

          {searchError && <div className='error'>{searchError}</div>}

          {searchResults.length > 0 && (
            <div className='search-results'>
              <p>
                Found {searchResults.length} result{searchResults.length > 1 ? 's' : ''} for &quot;
                {searchTerm}&quot;
              </p>
              <ul>
                {searchResults.map(result => (
                  <SearchResultCard
                    key={String(result._id)}
                    result={result}
                    handleClick={() => handleSearchResultClick(result)}
                  />
                ))}
              </ul>
            </div>
          )}

          {chats.map(chat => (
            <ChatsListCard key={String(chat._id)} chat={chat} handleChatSelect={handleChatSelect} />
          ))}
        </div>

        <div className='chat-container'>
          {selectedChat ? (
            <>
              <h2>Chat Participants: {selectedChat.participants.join(', ')}</h2>
              <div className='chat-messages'>
                {selectedChat.messages.map(message => (
                  <div
                    key={String(message._id)}
                    ref={el => {
                      messageRefs.current[String(message._id)] = el;
                    }}
                    className={`message-wrapper${
                      highlightedMessageId?.toString() === String(message._id) ? ' highlight' : ''
                    }`}>
                    <MessageCard message={message} />
                  </div>
                ))}
              </div>
              <div className='message-input'>
                <input
                  className='custom-input'
                  type='text'
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder='Type a message...'
                />
                <button className='custom-button' onClick={handleSendMessage}>
                  Send
                </button>

                <SpotifySharingComponent {...spotifySharing} />
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
