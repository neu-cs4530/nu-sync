import React from 'react';
import './index.css';
import { ObjectId } from 'mongodb';
import {
  PopulatedDatabaseChat,
  SafeDatabaseUser,
} from '../../../../types/types';
import UserStatusIcon from '../../UserStatusIcon';

/**
 * ChatsListCard component displays information about a chat and allows the user to select it.
 *
 * @param chat: The chat object containing details like participants and chat ID.
 * @param handleChatSelect: A function to handle the selection of a chat, receiving the chat's ID as an argument.
 */
const ChatsListCard = ({
  chat,
  handleChatSelect,
  currentUsername,
  userMap,
}: {
  chat: PopulatedDatabaseChat;
  handleChatSelect: (chatID: ObjectId | undefined) => void;
  currentUsername: string;
  userMap: Record<string, SafeDatabaseUser>;
}) => {
  const otherParticipants = chat.participants.filter(
    (p) => p !== currentUsername,
  );

  return (
    <div onClick={() => handleChatSelect(chat._id)} className="chats-list-card">
      <p>
        <strong>Chat with:</strong>{' '}
        {otherParticipants.map((username) => {
          const user = userMap[username];
          const status = user?.onlineStatus?.status ?? 'offline';

          return (
            <span key={username} className="chat-user flex items-center gap-2">
              {username}
              <UserStatusIcon status={status} />
            </span>
          );
        })}
      </p>
    </div>
  );
};

export default ChatsListCard;
