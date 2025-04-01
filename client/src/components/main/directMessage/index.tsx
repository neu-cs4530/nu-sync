import './index.css';
import { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useDirectMessage from '../../../hooks/useDirectMessage';
import ChatsListCard from './chatsListCard';
import FriendsListPage from '../friendsListPage';
import MessageCard from '../messageCard';
import SearchResultCard from './searchResultCard';
import SpotifySharingComponent from './spotifySharing';

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

const DirectMessage = () => {
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

  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    const syncDimensions = () => {
      if (textareaRef.current && preRef.current) {
        preRef.current.style.width = `${textareaRef.current.offsetWidth}px`;
        preRef.current.style.height = `${textareaRef.current.offsetHeight}px`;
      }
    };

    syncDimensions();
    window.addEventListener('resize', syncDimensions);
    return () => window.removeEventListener('resize', syncDimensions);
  }, []);

  useEffect(() => {
    const userToChat = localStorage.getItem('openChatWith');
    if (userToChat) {
      localStorage.removeItem('openChatWith');
      handleDirectChatWithFriend(userToChat);
    }
  }, [handleDirectChatWithFriend]);

  const handleSendCodeMessage = () => {
    if (code.trim()) {
      setNewMessage(`\`\`\`${language}\n${code}\n\`\`\``);
      setCode('');
      setShowCodeEditor(false);
    }
  };

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
        <div className="chats-list">
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

          {chats.map(chat => (
            <ChatsListCard key={String(chat._id)} chat={chat} handleChatSelect={handleChatSelect} />
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
                    className={`message-wrapper${highlightedMessageId?.toString() === String(message._id)
                        ? ' highlight'
                        : ''
                      }`}
                  >
                    <MessageCard message={message} />
                  </div>
                ))}
              </div>

              <div className="message-input">
                {showCodeEditor ? (
                  <div className="code-editor-container">
                    <div className="code-editor-controls">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="language-select"
                      >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                      <button
                        className="custom-button"
                        onClick={() => setShowCodeEditor(false)}
                      >
                        Cancel
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <textarea
                        ref={textareaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onScroll={handleScroll}
                        className="code-textarea"
                        placeholder="Type your code here..."
                      />
                      <pre
                        ref={preRef}
                        className="code-highlight"
                      >
                        <SyntaxHighlighter
                          language={language}
                          style={tomorrow}
                          showLineNumbers
                          customStyle={{
                            background: 'transparent',
                            margin: 0,
                            padding: '10px',
                          }}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </pre>
                    </div>
                    <button
                      className="custom-button primary"
                      onClick={handleSendCodeMessage}
                    >
                      Send Code
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="message-input-row">
                      <input
                        className="custom-input"
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                      />
                      <button
                        className="custom-button"
                        onClick={() => setShowCodeEditor(true)}
                        title="Insert code"
                      >
                        {`Code Editor`}
                      </button>
                      <button className="custom-button" onClick={handleSendMessage}>
                        Send
                      </button>
                    </div>
                    <div className='spotify-panel-wrapper'>
                      <SpotifySharingComponent {...spotifySharing} />
                    </div>
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