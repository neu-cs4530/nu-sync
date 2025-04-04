import './index.css';
import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeEditor from '@uiw/react-textarea-code-editor';
import useDirectMessage from '../../../hooks/useDirectMessage';
import ChatsListCard from './chatsListCard';
import FriendsListPage from '../friendsListPage';
import MessageCard from '../messageCard';
import SearchResultCard from './searchResultCard';
import SpotifySharingComponent from './spotifySharing';
import { DatabaseMessage, CodeSnippet, MessageSearchResult } from '../../../types/types';
import { getMetaData } from '../../../tool';

const SUPPORTED_LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'csharp', label: 'C#' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
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
  const [language, setLanguage] = useState('python');
  const [isCodeSnippetPreview, setIsCodeSnippetPreview] = useState(false);
  const [codeSnippetPreview, setCodeSnippetPreview] = useState<CodeSnippet | null>(null);

  useEffect(() => {
    const userToChat = localStorage.getItem('openChatWith');
    if (userToChat) {
      localStorage.removeItem('openChatWith');
      handleDirectChatWithFriend(userToChat);
    }
  }, [handleDirectChatWithFriend]);

  // Check if the new message is a code snippet
  useEffect(() => {
    try {
      const parsedMessage = JSON.parse(newMessage);
      if (parsedMessage.isCodeSnippet && parsedMessage.codeSnippet) {
        setIsCodeSnippetPreview(true);
        setCodeSnippetPreview(parsedMessage.codeSnippet);
      } else {
        setIsCodeSnippetPreview(false);
        setCodeSnippetPreview(null);
      }
    } catch (e) {
      // Not a JSON message
      setIsCodeSnippetPreview(false);
      setCodeSnippetPreview(null);
    }
  }, [newMessage]);

  const handleSendCodeMessage = () => {
    if (code.trim()) {
      // Using the CodeSnippet interface to structure the code message
      const codeSnippet: CodeSnippet = {
        code,
        language,
      };

      // Set the newMessage with information that this is a code snippet
      setNewMessage(JSON.stringify({
        isCodeSnippet: true,
        codeSnippet
      }));

      setCode('');
      setShowCodeEditor(false);
    }
  };

  // Render message with support for code snippets
  const renderMessage = (message: DatabaseMessage) => {
    // Add message header with username and timestamp
    const messageHeader = (
      <div className="message-header">
        <div className="message-sender">{message.msgFrom}</div>
        <div className="message-time">{getMetaData(new Date(message.msgDateTime))}</div>
      </div>
    );

    // Check if the message has a code snippet
    if (message.isCodeSnippet && message.codeSnippet) {
      return (
        <div className="message">
          {messageHeader}
          <SyntaxHighlighter
            language={message.codeSnippet.language}
            style={tomorrow}
            customStyle={{
              borderRadius: '4px',
              margin: '10px 0'
            }}
          >
            {message.codeSnippet.code}
          </SyntaxHighlighter>
        </div>
      );
    }

    // For backward compatibility, try to parse the message to check if it contains code snippet info
    try {
      const parsedContent = JSON.parse(message.msg);
      if (parsedContent.isCodeSnippet && parsedContent.codeSnippet) {
        return (
          <div className="message">
            {messageHeader}
            <SyntaxHighlighter
              language={parsedContent.codeSnippet.language}
              style={tomorrow}
              customStyle={{
                borderRadius: '4px',
                margin: '10px 0'
              }}
            >
              {parsedContent.codeSnippet.code}
            </SyntaxHighlighter>
          </div>
        );
      }
    } catch (e) {
      // Not a JSON message, render normally
    }

    // Default case, render normally
    return <MessageCard message={message} />;
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
                {searchResults.map((result: MessageSearchResult) => (
                  <SearchResultCard
                    key={String(result._id)}
                    result={result}
                    handleClick={() => handleSearchResultClick(result)}
                  />
                ))}
              </ul>
            </div>
          )}

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
                      if (messageRefs.current && el) {
                        messageRefs.current[String(message._id)] = el;
                      }
                    }}
                    className={`message-wrapper${highlightedMessageId?.toString() === String(message._id)
                      ? ' highlight'
                      : ''
                      }`}
                  >
                    {renderMessage(message)}
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

                    <CodeEditor
                      value={code}
                      language={language}
                      onChange={(e) => setCode(e.target.value)}
                      padding={10}
                      style={{
                        fontSize: 14,
                        minHeight: 200,
                        backgroundColor: "#ffffff",
                        fontFamily: 'monospace',
                        lineHeight: '1.5',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                      data-color-mode="light"
                      className="code-editor-fix"
                    />

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
                      {isCodeSnippetPreview && codeSnippetPreview ? (
                        <div className="code-snippet-preview">
                          <div className="code-preview-header">
                            <div className="preview-language">
                              <div className="language-indicator"></div>
                              <span>{SUPPORTED_LANGUAGES.find(lang => lang.value === codeSnippetPreview.language)?.label || codeSnippetPreview.language} Code</span>
                            </div>
                            <button
                              className="custom-button secondary clear-button"
                              onClick={() => {
                                setNewMessage('');
                                setIsCodeSnippetPreview(false);
                                setCodeSnippetPreview(null);
                              }}
                            >
                              Clear
                            </button>
                          </div>
                          <SyntaxHighlighter
                            language={codeSnippetPreview.language}
                            style={tomorrow}
                            customStyle={{
                              borderRadius: 'var(--radius-sm)',
                              margin: '0',
                              maxHeight: '120px',
                              overflow: 'auto',
                              boxShadow: 'var(--shadow-sm)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {codeSnippetPreview.code}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <input
                          className="custom-input"
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                        />
                      )}
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
            <h2>Start A New Chat</h2>
          )}
        </div>
      </div>
    </>
  );
};

export default DirectMessage;