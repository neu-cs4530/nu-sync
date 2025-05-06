import React, { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { DatabaseMessage, Message, MessageUpdatePayload, SafeDatabaseUser } from '../types/types';
import { addMessage, getMessages } from '../services/messageService';
import { getUserByUsername } from '../services/userService';

/**
 * Custom hook that handles the logic for the messaging page.
 *
 * @returns messages - The list of messages.
 * @returns newMessage - The new message to be sent.
 * @returns setNewMessage - The function to set the new message.
 * @returns handleSendMessage - The function to handle sending a new message.
 */
const useMessagingPage = () => {
  const { user, socket } = useUserContext();
  const [messages, setMessages] = React.useState<DatabaseMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [userMap, setUserMap] = useState<Record<string, SafeDatabaseUser>>({});

  useEffect(() => {
    const fetchMessages = async () => {
      const msgs = await getMessages();
      setMessages(msgs);
    };

    fetchMessages();
  }, []);
  
  useEffect(() => {
    const handleMessageUpdate = async (data: MessageUpdatePayload) => {
      setMessages(prevMessages => [...prevMessages, data.msg]);
    };

    socket.on('messageUpdate', handleMessageUpdate);

    return () => {
      socket.off('messageUpdate', handleMessageUpdate);
    };
  }, [socket]);

  useEffect(() => {
    const handleUserUpdate = (payload: { user: SafeDatabaseUser; type: string }) => {
      const updatedUser = payload.user;
      setUserMap(prevMap => {
        if (!(updatedUser.username in prevMap)) return prevMap;
        return { ...prevMap, [updatedUser.username]: updatedUser };
      });
    };

    socket.on('userUpdate', handleUserUpdate);

    return () => {
      socket.off('userUpdate', handleUserUpdate);
    };
  }, [socket]);

  useEffect(() => {
    const fetchMissingUsers = async () => {
      const missingUsernames = Array.from(new Set(messages.map(msg => msg.msgFrom))).filter(
        username => !userMap[username],
      );

      if (missingUsernames.length === 0) return;

      const newMap: Record<string, SafeDatabaseUser> = { ...userMap };

      await Promise.all(
        missingUsernames.map(async username => {
          try {
            const fetchedUser = await getUserByUsername(username);
            newMap[username] = fetchedUser;
          } catch (err) {
            // console.error(`Failed to fetch user ${username}:`, err);
          }
        }),
      );

      setUserMap(newMap);
    };
    fetchMissingUsers();
  }, [messages, userMap]);

  /**
   * Handles sending a new message.
   *
   * @returns void
   */
  const handleSendMessage = async () => {
    if (newMessage === '') {
      setError('Message cannot be empty');
      return;
    }

    setError('');

    const newMsg: Omit<Message, 'type'> = {
      msg: newMessage,
      msgFrom: user.username,
      msgDateTime: new Date(),
    };

    await addMessage(newMsg);

    setNewMessage('');
  };
  
  return { userMap, messages, newMessage, setNewMessage, handleSendMessage, error };
};

export default useMessagingPage;
