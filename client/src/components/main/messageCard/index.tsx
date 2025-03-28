import React from 'react';
import './index.css';
import { DatabaseMessage } from '../../../types/types';
import { getMetaData } from '../../../tool';

/**
 * MessageCard component displays a single message with its sender and timestamp.
 * If the message contains a Spotify playlist link, it will be rendered as a clickable link.
 *
 * @param message: The message object to display.
 */
const MessageCard = ({ message }: { message: DatabaseMessage }) => {
  // comnverts URLs in a message to clickable links
  const renderMessageWithLinks = (text: string) => {
    // regular expression to match Spotify URLs
    const spotifyUrlRegex = /(https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+)/g;
    const parts = text.split(spotifyUrlRegex);
    
    // if part of the message is a Spotify URL, render it as a link
    return parts.map((part, index) => {
      if (part.match(spotifyUrlRegex)) {
        return (
          <a 
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="spotify-link"
          >
            {part}
          </a>
        );
      }
      // otherwise it is just a normal message
      return part;
    });
  };

  return (
    <div className='message'>
      <div className='message-header'>
        <div className='message-sender'>{message.msgFrom}</div>
        <div className='message-time'>{getMetaData(new Date(message.msgDateTime))}</div>
      </div>
      <div className='message-body'>{renderMessageWithLinks(message.msg)}</div>
    </div>
  );
};

export default MessageCard;
