import React from 'react';
import './index.css';
import { DatabaseMessage, SafeDatabaseUser } from '../../../types/types';
import { getMetaData } from '../../../tool';
import UserStatusIcon from '../UserStatusIcon';
import SpotifyPlaylistCard from '../directMessage/spotifyCards/playlist';
import SpotifySongCard from '../directMessage/spotifyCards/songs';

interface Props {
  message: DatabaseMessage;
  sender?: SafeDatabaseUser;
}

/**
 * MessageCard component displays a single message with its sender and timestamp.
 * If the message contains a Spotify playlist or song link, it will be rendered as a clickable link.
 *
 * @param message: The message object to display.
 */
const MessageCard: React.FC<Props> = ({ message, sender }) => {
  // Renders message content with support for Spotify links and JSON-formatted content
  const renderMessageContent = (currentMessage: DatabaseMessage) => {
    try {
      const parsedContent = JSON.parse(currentMessage.msg);
      if (parsedContent.type === 'spotify-song') {
        return (
          <SpotifySongCard
            name={parsedContent.name}
            artists={parsedContent.artists}
            spotifyUrl={parsedContent.url}
          />
        );
      }

      if (parsedContent.type === 'spotify-playlist') {
        return (
          <SpotifyPlaylistCard
            name={parsedContent.name}
            url={parsedContent.url}
            owner={parsedContent.owner}
            image={parsedContent.image}
            description={parsedContent.description}
          />
        );
      }
    } catch (e) {
      // Not a JSON message, continue with regular link parsing
    }
    const playlistRegex =
      /Check out this playlist: (.+) \(link: (https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+)\)/;
    const match = currentMessage.msg.match(playlistRegex);

    if (match) {
      const [, name, url] = match;
      return (
        <>
          Check out this playlist:{' '}
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-[#1DB954] hover:underline hover:text-[#1DB954]/80 transition-colors duration-200'>
            {name}
          </a>
        </>
      );
    }

    // Check for direct Spotify URLs (as a fallback)
    const urlRegex = /(https?:\/\/open\.spotify\.com\/(track|playlist|album)\/[a-zA-Z0-9]+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    // Find all Spotify URL matches
    const matches = currentMessage.msg.matchAll(urlRegex);

    for (const urlMatch of matches) {
      // Add text before the URL
      if (urlMatch.index !== undefined && urlMatch.index > lastIndex) {
        parts.push(currentMessage.msg.substring(lastIndex, urlMatch.index));
      }

      // Add the URL as a link
      if (urlMatch[0]) {
        parts.push(
          <a
            key={urlMatch.index}
            href={urlMatch[0]}
            target='_blank'
            rel='noopener noreferrer'
            className='text-[#1DB954] hover:underline hover:text-[#1DB954]/80 transition-colors duration-200'>
            {urlMatch[0]}
          </a>,
        );
      }

      // Update last index
      if (urlMatch.index !== undefined) {
        lastIndex = urlMatch.index + urlMatch[0].length;
      }
    }

    // Add any remaining text
    if (lastIndex < currentMessage.msg.length) {
      parts.push(currentMessage.msg.substring(lastIndex));
    }

    return parts.length > 0 ? parts : currentMessage.msg;
  };

  return (
    <div className='message'>
      <div className='message-header'>
        <div className='message-sender flex items-center gap-2'>
          <span>{message.msgFrom}</span>
          {sender?.onlineStatus && <UserStatusIcon status={sender.onlineStatus.status} />}
        </div>
        <div className='message-time'>{getMetaData(new Date(message.msgDateTime))}</div>
      </div>
      <div className='message-body'>{renderMessageContent(message)}</div>
    </div>
  );
};

export default MessageCard;
