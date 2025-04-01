import './index.css';
import { useState } from 'react';
import MessageCard from '../messageCard';
import useMessagingPage from '../../../hooks/useMessagingPage';
import useUserContext from '../../../hooks/useUserContext';

const MessagingPage = () => {
  const { messages, newMessage, setNewMessage, handleSendMessage, error } = useMessagingPage();
  const { user } = useUserContext();
  const [isCodeInput, setIsCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  const handleSendCodeMessage = async () => {
    if (!code.trim()) {
      return; // You might want to set error state here
    }

    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Create a properly formatted message object
    const messageToSend = {
      msg: `Code snippet (${language})`,
      msgFrom: user.username,
      msgDateTime: new Date(),
      isCodeSnippet: true,
      codeSnippet: {
        code,
        language
      }
    };

    // Temporarily store the formatted message in newMessage
    setNewMessage(JSON.stringify(messageToSend));

    // Trigger the send
    await handleSendMessage();

    // Reset code input state
    setCode('');
    setIsCodeInput(false);
  };

  return (
    <div className='chat-room'>
      <div className='chat-header'>
        <h2>Chat Room</h2>
      </div>
      <div className='chat-messages'>
        {messages.map(message => (
          <MessageCard key={String(message._id)} message={message} />
        ))}
      </div>
      <div className='message-input'>
        {isCodeInput ? (
          <div className="code-input-container">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-selector"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="html">HTML</option>
            </select>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="code-textbox"
              placeholder="Enter your code here..."
              rows={6}
            />
            <div className="message-actions">
              <button
                type='button'
                className='send-button'
                onClick={handleSendCodeMessage}
                disabled={!code.trim()}
              >
                Send Code
              </button>
              <button
                type='button'
                className='cancel-button'
                onClick={() => setIsCodeInput(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <textarea
              className='message-textbox'
              placeholder='Type your message here'
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <div className='message-actions'>
              <button
                type='button'
                className='code-button'
                onClick={() => setIsCodeInput(true)}
              >
                Send Code
              </button>
              <button
                type='button'
                className='send-button'
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                Send
              </button>
              {error && <span className='error-message'>{error}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;