import React, { useEffect, useState, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { BsSpotify } from 'react-icons/bs';
import useDirectMessage from '../../../hooks/useDirectMessage';
import ChatsListCard from './chatsListCard';
import FriendsListPage from '../friendsListPage';
import MessageCard from '../messageCard';
import SearchResultCard from './searchResultCard';
import SpotifySharingComponent from './spotifySharing';
import {
  DatabaseMessage,
  CodeSnippet,
  MessageSearchResult,
  SafeDatabaseUser,
  CodeExecutionResult,
} from '../../../types/types';
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
  const [isCodeSnippetPreview, setIsCodeSnippetPreview] =
    useState<boolean>(false);
  const [codeSnippetPreview, setCodeSnippetPreview] =
    useState<CodeSnippet | null>(null);
  const [isExecutingCode, setIsExecutingCode] = useState<boolean>(false);
  const [codeExecutionResult, setCodeExecutionResult] =
    useState<CodeExecutionResult | null>(null);
  const [spotifyPanelOpen, setSpotifyPanelOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userToChat = localStorage.getItem('openChatWith');
    if (userToChat) {
      localStorage.removeItem('openChatWith');
      handleDirectChatWithFriend(userToChat);
    }
  }, [handleDirectChatWithFriend]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

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
        executedAt: new Date(),
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
        executedAt: new Date(),
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
      setNewMessage(
        JSON.stringify({
          isCodeSnippet: true,
          codeSnippet,
        }),
      );

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
        executionResult: codeExecutionResult,
      };

      // Set the newMessage with code snippet and execution result
      setNewMessage(
        JSON.stringify({
          isCodeSnippet: true,
          codeSnippet,
        }),
      );

      setCode('');
      setCodeExecutionResult(null);
      setShowCodeEditor(false);
    }
  };

  // Render message with support for code snippets
  const renderMessage = (
    message: DatabaseMessage,
    sender?: SafeDatabaseUser,
  ) => {
    // Add message header with username and timestamp
    const messageHeader = (
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          {sender?.onlineStatus && (
            <UserStatusIcon status={sender.onlineStatus.status} />
          )}
          <span className="font-medium text-gray-800 ml-1">
            {message.msgFrom}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {getMetaData(new Date(message.msgDateTime))}
        </div>
      </div>
    );

    // Check if the message has a code snippet with direct properties
    if (message.isCodeSnippet && message.codeSnippet) {
      const hasExecutionResult =
        'executionResult' in message.codeSnippet &&
        message.codeSnippet.executionResult;

      return (
        <div className="p-3 bg-white rounded-lg shadow-sm mb-3">
          {messageHeader}
          <div className="mt-2 border rounded-md overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {SUPPORTED_LANGUAGES.find(
                  (lang) => lang.value === message.codeSnippet?.language,
                )?.label || message.codeSnippet?.language}
              </span>
            </div>

            <SyntaxHighlighter
              language={message.codeSnippet.language}
              style={tomorrow}
              customStyle={{
                borderRadius: '0 0 4px 4px',
                margin: '0',
              }}
            >
              {message.codeSnippet.code}
            </SyntaxHighlighter>

            {hasExecutionResult && message.codeSnippet.executionResult && (
              <div className="border-t p-3 bg-gray-50">
                <div className="flex justify-end mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      message.codeSnippet.executionResult.code === 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {message.codeSnippet.executionResult.code === 0
                      ? 'Success'
                      : 'Error'}
                  </span>
                </div>

                {message.codeSnippet.executionResult.stdout && (
                  <div className="bg-gray-100 p-2 rounded-md mb-2">
                    <pre className="text-sm whitespace-pre-wrap">
                      {message.codeSnippet.executionResult.stdout}
                    </pre>
                  </div>
                )}

                {message.codeSnippet.executionResult.stderr && (
                  <div className="bg-red-50 p-2 rounded-md">
                    <div className="text-xs font-medium text-red-800 mb-1">
                      Error:
                    </div>
                    <pre className="text-sm whitespace-pre-wrap text-red-700">
                      {message.codeSnippet.executionResult.stderr}
                    </pre>
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
        const hasExecutionResult =
          'executionResult' in codeSnippet && codeSnippet.executionResult;

        return (
          <div className="p-3 bg-white rounded-lg shadow-sm mb-3">
            {messageHeader}
            <div className="mt-2 border rounded-md overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {SUPPORTED_LANGUAGES.find(
                    (lang) => lang.value === codeSnippet.language,
                  )?.label || codeSnippet.language}
                </span>
              </div>

              <SyntaxHighlighter
                language={codeSnippet.language}
                style={tomorrow}
                customStyle={{
                  borderRadius: '0 0 4px 4px',
                  margin: '0',
                }}
              >
                {codeSnippet.code}
              </SyntaxHighlighter>

              {hasExecutionResult && codeSnippet.executionResult && (
                <div className="border-t p-3 bg-gray-50">
                  <div className="flex justify-end mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        codeSnippet.executionResult.code === 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {codeSnippet.executionResult.code === 0
                        ? 'Success'
                        : 'Error'}
                    </span>
                  </div>

                  {codeSnippet.executionResult.stdout && (
                    <div className="bg-gray-100 p-2 rounded-md mb-2">
                      <pre className="text-sm whitespace-pre-wrap">
                        {codeSnippet.executionResult.stdout}
                      </pre>
                    </div>
                  )}

                  {codeSnippet.executionResult.stderr && (
                    <div className="bg-red-50 p-2 rounded-md">
                      <div className="text-xs font-medium text-red-800 mb-1">
                        Error:
                      </div>
                      <pre className="text-sm whitespace-pre-wrap text-red-700">
                        {codeSnippet.executionResult.stderr}
                      </pre>
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Create Panel */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          onClick={() => setShowCreatePanel((prev) => !prev)}
        >
          {showCreatePanel ? 'Hide Create Chat Panel' : 'Start a Chat'}
        </button>

        {chatError && (
          <div className="mt-2 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {chatError}
          </div>
        )}

        {showCreatePanel && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Chat with your friends
            </h3>
            <FriendsListPage handleFriendSelect={handleDirectChatWithFriend} />
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 gap-4 h-full overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white rounded-lg shadow flex flex-col overflow-hidden">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="p-3 border-b">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Search Results */}
          <div className="overflow-auto flex-1">
            {searchError && (
              <div className="m-3 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {searchError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="m-3 bg-white rounded-lg border p-3">
                <p className="text-sm text-gray-700 mb-3">
                  Found {searchResults.length} result
                  {searchResults.length > 1 ? 's' : ''} for &quot;{searchTerm}
                  &quot;
                </p>
                <div className="space-y-2">
                  {searchResults.map((result: MessageSearchResult) => (
                    <SearchResultCard
                      key={String(result._id)}
                      result={result}
                      handleClick={() => handleSearchResultClick(result)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Chat List */}
            <div className="p-3 space-y-2">
              {chats.map((chat) => (
                <ChatsListCard
                  key={String(chat._id)}
                  chat={chat}
                  handleChatSelect={handleChatSelect}
                  userMap={userMap}
                  currentUsername={user.username}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Chat Content Area */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 py-3 bg-gray-50 border-b">
            {selectedChat ? (
              <h2 className="text-lg font-semibold text-gray-800">
                Chat with:{' '}
                {selectedChat.participants
                  .filter((p) => p !== user.username)
                  .join(', ')}
              </h2>
            ) : (
              <h2 className="text-lg font-semibold text-gray-800">
                Select or start a chat
              </h2>
            )}
          </div>

          {/* Messages Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {selectedChat ? (
              <div className="space-y-3">
                {selectedChat.messages.map((message) => (
                  <div
                    key={String(message._id)}
                    ref={(el) => {
                      if (messageRefs.current && el) {
                        messageRefs.current[String(message._id)] = el;
                      }
                    }}
                    className={`transition-colors ${
                      highlightedMessageId?.toString() === String(message._id)
                        ? 'bg-yellow-100'
                        : ''
                    }`}
                  >
                    {renderMessage(message, userMap[message.msgFrom])}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 italic">
                  Select a chat to view messages
                </p>
              </div>
            )}
          </div>

          {/* Message Input Area - Fixed at bottom */}
          {selectedChat && (
            <div className="p-3 border-t bg-white">
              {showCodeEditor ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>

                    <button
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
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
                      backgroundColor: '#ffffff',
                      fontFamily: 'monospace',
                      lineHeight: 1.5,
                      borderRadius: '0.375rem',
                      border: '1px solid #e5e7eb',
                    }}
                    data-color-mode="light"
                  />

                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
                      onClick={handleExecuteCode}
                      disabled={isExecutingCode}
                    >
                      {isExecutingCode ? 'Executing...' : 'Execute Code'}
                    </button>

                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                      onClick={
                        codeExecutionResult
                          ? handleSendCodeWithResult
                          : handleSendCodeMessage
                      }
                    >
                      {codeExecutionResult
                        ? 'Send Code with Result'
                        : 'Send Code'}
                    </button>
                  </div>

                  {codeExecutionResult && (
                    <div className="border rounded-md p-3 bg-gray-50">
                      <h4 className="text-sm font-semibold mb-2">
                        Execution Result
                      </h4>

                      <div className="flex justify-end mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            codeExecutionResult.code === 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {codeExecutionResult.code === 0 ? 'Success' : 'Error'}
                        </span>
                      </div>

                      {codeExecutionResult.stdout && (
                        <div className="bg-gray-100 p-2 rounded-md mb-2">
                          <h5 className="text-xs font-medium text-gray-700 mb-1">
                            Output:
                          </h5>
                          <pre className="text-sm whitespace-pre-wrap">
                            {codeExecutionResult.stdout}
                          </pre>
                        </div>
                      )}

                      {codeExecutionResult.stderr && (
                        <div className="bg-red-50 p-2 rounded-md">
                          <h5 className="text-xs font-medium text-red-800 mb-1">
                            Error:
                          </h5>
                          <pre className="text-sm whitespace-pre-wrap text-red-700">
                            {codeExecutionResult.stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    {isCodeSnippetPreview && codeSnippetPreview ? (
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {SUPPORTED_LANGUAGES.find(
                                (lang) =>
                                  lang.value === codeSnippetPreview.language,
                              )?.label || codeSnippetPreview.language}{' '}
                              Code
                            </span>
                          </div>
                          <button
                            className="text-xs text-gray-600 hover:text-gray-800"
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
                            borderRadius: '0 0 0.375rem 0.375rem',
                            margin: '0',
                            maxHeight: '120px',
                            overflow: 'auto',
                          }}
                        >
                          {codeSnippetPreview.code}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                        onClick={() => setShowCodeEditor(true)}
                      >
                        Code Editor
                      </button>
                      {spotifySharing.isConnected && (
                        <button
                          className="px-4 py-2 bg-[#1db954] text-white rounded-md hover:bg-[#18a549] transition-colors text-sm font-medium"
                          onClick={() => setSpotifyPanelOpen(true)}
                        >
                          <span className="flex items-center gap-1">
                            <BsSpotify className="text-sm" />
                            Spotify
                          </span>
                        </button>
                      )}
                    </div>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                      onClick={handleSendMessage}
                    >
                      Send
                    </button>
                  </div>

                  {/* Spotify Component with positioned container to ensure visibility */}
                  {spotifySharing.isConnected && (
                    <div className="relative mt-2" style={{ height: 0 }}>
                      <SpotifySharingComponent
                        {...spotifySharing}
                        panelOpen={spotifyPanelOpen}
                        setPanelOpen={setSpotifyPanelOpen}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
