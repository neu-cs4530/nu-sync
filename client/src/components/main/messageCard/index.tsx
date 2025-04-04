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
  // converts URLs in a message to clickable links
  const renderMessageWithLinks = (text: string) => {
    // regular expression to match Spotify URLs
    const playlistRegex =
      /Check out this playlist: (.+) \(link: (https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+)\)/;

    // check if the message contains a Spotify playlist link
    const match = text.match(playlistRegex);
    if (match) {
      const [, name, url] = match;
      return (
        <>
          Check out this playlist:{' '}
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className='spotify-link'>
            {name}
          </a>
        </>
      );
    }

    return text; // fallback if no match
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