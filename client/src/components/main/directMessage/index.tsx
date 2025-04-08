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
import { DatabaseMessage, CodeSnippet, MessageSearchResult, SafeDatabaseUser, CodeExecutionResult } from '../../../types/types';
import { getMetaData } from '../../../tool';
import UserStatusIcon from '../UserStatusIcon';
import { executeCode } from '../../../services/pistonService';

const SUPPORTED_LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'csharp', label: 'C#' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const DirectMessage = () => {
  const {
    user,
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
    error: chatError,
    spotifySharing,
    userMap,
  } = useDirectMessage();

  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [isCodeSnippetPreview, setIsCodeSnippetPreview] = useState<boolean>(false);
  const [codeSnippetPreview, setCodeSnippetPreview] = useState<CodeSnippet | null>(null);

  // New state variables for code execution
  const [isExecutingCode, setIsExecutingCode] = useState<boolean>(false);
  const [codeExecutionResult, setCodeExecutionResult] = useState<CodeExecutionResult | null>(null);
  // Removed state for versions and stdin

  useEffect(() => {
    const userToChat = localStorage.getItem('openChatWith');
    if (userToChat) {
      localStorage.removeItem('openChatWith');
      handleDirectChatWithFriend(userToChat);
    }
  }, [handleDirectChatWithFriend]);

  // Removed runtime fetching effect

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

  // Function to handle code execution
  const handleExecuteCode = async () => {
    if (!code.trim()) return;

    setIsExecutingCode(true);
    try {
      const result = await executeCode(code, language, null, '', []);

      setCodeExecutionResult({
        stdout: result.run.stdout,
        stderr: result.run.stderr,
        output: result.run.output,
        code: result.run.code,
        signal: result.run.signal,
        language: result.language,
        version: result.version,
        executedAt: new Date()
      });
    } catch (executeError) {
      // TypeScript requires a type guard for error
      let errorMessage = 'Execution failed';
      if (executeError instanceof Error) {
        errorMessage = executeError.message;
      }

      setCodeExecutionResult({
        stdout: '',
        stderr: errorMessage,
        output: errorMessage,
        code: 1,
        signal: null,
        language,
        version: '',
        executedAt: new Date()
      });
    } finally {
      setIsExecutingCode(false);
    }
  };

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

  // Function to send a code message with execution result
  const handleSendCodeWithResult = () => {
    if (code.trim() && codeExecutionResult) {
      // Create a CodeSnippet with execution result
      const codeSnippet: CodeSnippet = {
        code,
        language,
        executionResult: codeExecutionResult
      };

      // Set the newMessage with code snippet and execution result
      setNewMessage(JSON.stringify({
        isCodeSnippet: true,
        codeSnippet
      }));

      setCode('');
      setCodeExecutionResult(null);
      setShowCodeEditor(false);
    }
  };

  // Render message with support for code snippets
  const renderMessage = (message: DatabaseMessage, sender?: SafeDatabaseUser) => {
    // Add message header with username and timestamp
    const messageHeader = (
      <div className='message-header'>
        <div className='message-sender'>
          {sender?.onlineStatus && <UserStatusIcon status={sender.onlineStatus.status} />}
          {message.msgFrom}
        </div>
        <div className='message-time'>{getMetaData(new Date(message.msgDateTime))}</div>
      </div>
    );

    // Check if the message has a code snippet with direct properties
    if (message.isCodeSnippet && message.codeSnippet) {
      const hasExecutionResult = 'executionResult' in message.codeSnippet && message.codeSnippet.executionResult;

      return (
        <div className='message'>
          {messageHeader}
          <div className="code-snippet-container">
            <div className="code-snippet-header">
              <span className="language-name">
                {SUPPORTED_LANGUAGES.find(lang => lang.value === message.codeSnippet?.language)?.label ||
                  message.codeSnippet?.language}
              </span>
            </div>

            <SyntaxHighlighter
              language={message.codeSnippet.language}
              style={tomorrow}
              customStyle={{
                borderRadius: '4px',
                margin: '10px 0',
              }}>
              {message.codeSnippet.code}
            </SyntaxHighlighter>

            {hasExecutionResult && message.codeSnippet.executionResult && (
              <div className="code-execution-result">
                <div className="execution-result-header">
                  <span className={`status-indicator ${message.codeSnippet.executionResult.code === 0 ? 'success' : 'error'}`}>
                    {message.codeSnippet.executionResult.code === 0 ? 'Success' : 'Error'}
                  </span>
                </div>

                {message.codeSnippet.executionResult.stdout && (
                  <div className="stdout">
                    <pre>{message.codeSnippet.executionResult.stdout}</pre>
                  </div>
                )}

                {message.codeSnippet.executionResult.stderr && (
                  <div className="stderr">
                    <div className="result-label">Error:</div>
                    <pre>{message.codeSnippet.executionResult.stderr}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // For backward compatibility, try to parse the message to check if it contains code snippet info
    try {
      const parsedContent = JSON.parse(message.msg);
      if (parsedContent.isCodeSnippet && parsedContent.codeSnippet) {
        const { codeSnippet } = parsedContent;
        const hasExecutionResult = 'executionResult' in codeSnippet && codeSnippet.executionResult;

        return (
          <div className='message'>
            {messageHeader}
            <div className="code-snippet-container">
              <div className="code-snippet-header">
                <span className="language-name">
                  {SUPPORTED_LANGUAGES.find(lang => lang.value === codeSnippet.language)?.label || codeSnippet.language}
                </span>
              </div>

              <SyntaxHighlighter
                language={codeSnippet.language}
                style={tomorrow}
                customStyle={{
                  borderRadius: '4px',
                  margin: '10px 0',
                }}>
                {codeSnippet.code}
              </SyntaxHighlighter>

              {hasExecutionResult && codeSnippet.executionResult && (
                <div className="code-execution-result">
                  <div className="execution-result-header">
                    <span className={`status-indicator ${codeSnippet.executionResult.code === 0 ? 'success' : 'error'}`}>
                      {codeSnippet.executionResult.code === 0 ? 'Success' : 'Error'}
                    </span>
                  </div>

                  {codeSnippet.executionResult.stdout && (
                    <div className="stdout">
                      <pre>{codeSnippet.executionResult.stdout}</pre>
                    </div>
                  )}

                  {codeSnippet.executionResult.stderr && (
                    <div className="stderr">
                      <div className="result-label">Error:</div>
                      <pre>{codeSnippet.executionResult.stderr}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }
    } catch (parseError) {
      // Not a JSON message, render normally
    }

    // Default case, render normally
    return <MessageCard message={message} sender={userMap[message.msgFrom]} />;
  };

  return (
    <>
      <div className='create-panel'>
        <button className='custom-button' onClick={() => setShowCreatePanel(prev => !prev)}>
          {showCreatePanel ? 'Hide Create Chat Panel' : 'Start a Chat'}
        </button>
        {chatError && <div className='direct-message-error'>{chatError}</div>}
        {showCreatePanel && (
          <>
            <p>Chat with your friends</p>
            <FriendsListPage handleFriendSelect={handleDirectChatWithFriend} />
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

          {chats.map(chat => (
            <ChatsListCard
              key={String(chat._id)}
              chat={chat}
              handleChatSelect={handleChatSelect}
              userMap={userMap}
              currentUsername={user.username}
            />
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
                      if (messageRefs.current && el) {
                        messageRefs.current[String(message._id)] = el;
                      }
                    }}
                    className={`message-wrapper${highlightedMessageId?.toString() === String(message._id) ? ' highlight' : ''
                      }`}>
                    {renderMessage(message, userMap[message.msgFrom])}
                  </div>
                ))}
              </div>

              <div className='message-input'>
                {showCodeEditor ? (
                  <div className='code-editor-container'>
                    <div className='code-editor-controls'>
                      <select
                        value={language}
                        onChange={e => {
                          setLanguage(e.target.value);
                        }}
                        className='language-select'>
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>

                      <button className='custom-button' onClick={() => setShowCodeEditor(false)}>
                        Cancel
                      </button>
                    </div>

                    <CodeEditor
                      value={code}
                      language={language}
                      onChange={e => setCode(e.target.value)}
                      padding={10}
                      style={{
                        fontSize: 14,
                        minHeight: 200,
                        backgroundColor: '#ffffff',
                        fontFamily: 'monospace',
                        lineHeight: '1.5',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                      data-color-mode='light'
                      className='code-editor-fix'
                    />

                    <div className='code-editor-actions'>
                      <button
                        className='custom-button primary'
                        onClick={handleExecuteCode}
                        disabled={isExecutingCode}>
                        {isExecutingCode ? 'Executing...' : 'Execute Code'}
                      </button>

                      <button
                        className='custom-button primary'
                        onClick={codeExecutionResult ? handleSendCodeWithResult : handleSendCodeMessage}>
                        {codeExecutionResult ? 'Send Code with Result' : 'Send Code'}
                      </button>
                    </div>

                    {codeExecutionResult && (
                      <div className='execution-result-preview'>
                        <h4>Execution Result</h4>

                        <div className={`status-indicator ${codeExecutionResult.code === 0 ? 'success' : 'error'}`}>
                          {codeExecutionResult.code === 0 ? 'Success' : 'Error'}
                        </div>

                        {codeExecutionResult.stdout && (
                          <div className='stdout'>
                            <h5>Output:</h5>
                            <pre>{codeExecutionResult.stdout}</pre>
                          </div>
                        )}

                        {codeExecutionResult.stderr && (
                          <div className='stderr'>
                            <h5>Error:</h5>
                            <pre>{codeExecutionResult.stderr}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className='message-input-container'>
                      <div className='message-input-content'>
                        {isCodeSnippetPreview && codeSnippetPreview ? (
                          <div className='code-snippet-preview'>
                            <div className='code-preview-header'>
                              <div className='preview-language'>
                                <div className='language-indicator'></div>
                                <span>
                                  {SUPPORTED_LANGUAGES.find(
                                    lang => lang.value === codeSnippetPreview.language,
                                  )?.label || codeSnippetPreview.language}{' '}
                                  Code
                                </span>
                              </div>
                              <button
                                className='custom-button secondary clear-button'
                                onClick={() => {
                                  setNewMessage('');
                                  setIsCodeSnippetPreview(false);
                                  setCodeSnippetPreview(null);
                                }}>
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
                                border: '1px solid var(--border-color)',
                              }}>
                              {codeSnippetPreview.code}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <input
                            className='custom-input'
                            type='text'
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder='Type a message...'
                          />
                        )}
                      </div>
                      <div className='message-input-buttons'>
                        <button
                          className='custom-button'
                          onClick={() => setShowCodeEditor(true)}
                          title='Insert code'>
                          Code Editor
                        </button>
                        <button className='custom-button' onClick={handleSendMessage}>
                          Send
                        </button>
                      </div>
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