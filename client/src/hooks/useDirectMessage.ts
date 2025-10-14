import { ObjectId } from 'mongodb';
import { useEffect, useRef, useState } from 'react';
import {
  ChatUpdatePayload,
  Message,
  MessageSearchResult,
  PopulatedDatabaseChat,
  SafeDatabaseUser,
} from '../types/types';
import useUserContext from './useUserContext';
import {
  createChat,
  getChatById,
  getChatsByUser,
  sendMessage,
  searchMessages,
} from '../services/chatService';
import useSpotifySharing from './useSpotifySharing';
import { getUserByUsername } from '../services/userService';

/**
 * useDirectMessage is a custom hook that provides state and functions for direct messaging between users.
 * It includes a selected user, messages, a new message state, and real-time user status syncing.
 */
const useDirectMessage = () => {
  const { user, socket } = useUserContext();
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  const [chatToCreate, setChatToCreate] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<PopulatedDatabaseChat | null>(null);
  const [chats, setChats] = useState<PopulatedDatabaseChat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, SafeDatabaseUser>>({});
  const fetchedUsernamesRef = useRef<Set<string>>(new Set());

  const [highlightedMessageId, setHighlightedMessageId] = useState<ObjectId | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);
  const [searchError, setSearchError] = useState('');

  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleJoinChat = (chatID: ObjectId) => {
    socket.emit('joinChat', String(chatID));
  };

  useEffect(() => {
    const fetchMissingUsers = async () => {
      if (!selectedChat) return;

      const uniqueUsernames = Array.from(new Set(selectedChat.messages.map(msg => msg.msgFrom)));
      const missingUsernames = uniqueUsernames.filter(username => !userMap[username]);

      if (missingUsernames.length === 0) return;

      const newMap = { ...userMap };

      await Promise.all(
        missingUsernames.map(async username => {
          try {
            const fetchedUser = await getUserByUsername(username);
            newMap[username] = fetchedUser;
          } catch (err) {
            // fail silently
          }
        }),
      );

      setUserMap(newMap);
    };

    fetchMissingUsers();
  }, [selectedChat, userMap]);

  useEffect(() => {
    const fetchMissingUsersFromChats = async () => {
      const allUsernames = Array.from(
        new Set(chats.flatMap(chat => chat.participants.filter(p => p !== user.username))),
      );

      const missing = allUsernames.filter(
        username => !userMap[username] && !fetchedUsernamesRef.current.has(username),
      );
      if (missing.length === 0) return;

      const newMap = { ...userMap };
      await Promise.all(
        missing.map(async username => {
          try {
            const fetched = await getUserByUsername(username);
            newMap[username] = fetched;
            fetchedUsernamesRef.current.add(username);
          } catch (err) {
            // console.warn(`Failed to fetch user "${username}"`, err);
            fetchedUsernamesRef.current.add(username);
          }
        }),
      );

      setUserMap(newMap);
    };

    fetchMissingUsersFromChats();
  }, [chats, user.username, userMap]);

  useEffect(() => {
    const handleUserUpdate = (payload: { user: SafeDatabaseUser; type: string }) => {
      setUserMap(prev => ({
        ...prev,
        [payload.user.username]: payload.user,
      }));
    };

    socket.on('userUpdate', handleUserUpdate);

    return () => {
      socket.off('userUpdate', handleUserUpdate);
    };
  }, [socket]);

  const spotifySharing = useSpotifySharing(selectedChat?._id);

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedChat?._id) {
      const message: Omit<Message, 'type'> = {
        msg: newMessage,
        msgFrom: user.username,
        msgDateTime: new Date(),
      };

      const chat = await sendMessage(message, selectedChat._id);

      setSelectedChat(chat);
      setError(null);
      setNewMessage('');
    } else {
      setError('Message cannot be empty');
    }
  };

  const handleChatSelect = async (chatID: ObjectId | undefined) => {
    if (!chatID) {
      setError('Invalid chat ID');
      return;
    }

    const chat = await getChatById(chatID);
    setSelectedChat(chat);
    handleJoinChat(chatID);
  };

  const handleUserSelect = (selectedUser: SafeDatabaseUser) => {
    setChatToCreate(selectedUser.username);
  };

  const handleCreateChat = async () => {
    const chat = await createChat([user.username, chatToCreate]);
    setSelectedChat(chat);
    handleJoinChat(chat._id);
    setShowCreatePanel(false);
  };

  const handleDirectChatWithFriend = async (username: string) => {
    try {
      const latestChats = await getChatsByUser(user.username);

      // Check if a chat already exists
      const existingChat = latestChats.find(
        chat =>
          chat.participants.length === 2 &&
          chat.participants.includes(user.username) &&
          chat.participants.includes(username),
      );

      if (existingChat) {
        // If chat exists, just select it
        setSelectedChat(existingChat);
        handleJoinChat(existingChat._id);
      } else {
        // Create new chat only if one doesn't exist
        const chat = await createChat([user.username, username]);
        setSelectedChat(chat);
        handleJoinChat(chat._id);
      }

      setShowCreatePanel(false);
    } catch (err) {
      setError(`Failed to create chat: ${(err as Error).message}`);
    }
  };


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      const results = await searchMessages(user.username, searchTerm.trim());
      setSearchResults(results);
      setSearchError('');
    } catch (err) {
      setSearchError((err as Error).message);
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = async (result: MessageSearchResult) => {
    await handleChatSelect(result.chatId);
    setSearchTerm('');
    setSearchResults([]);
    setHighlightedMessageId(result._id);

    setTimeout(() => {
      const target = messageRefs.current[String(result._id)];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 1500);
  };

  useEffect(() => {
    const fetchChats = async () => {
      const userChats = await getChatsByUser(user.username);
      setChats(userChats);
    };

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      const { chat, type } = chatUpdate;

      switch (type) {
        case 'created': {
          if (chat.participants.includes(user.username)) {
            setChats(prevChats => [chat, ...prevChats]);
          }
          return;
        }
        case 'newMessage': {
          setSelectedChat(chat);
          return;
        }
        case 'newParticipant': {
          if (chat.participants.includes(user.username)) {
            setChats(prevChats => {
              if (prevChats.some(c => chat._id === c._id)) {
                return prevChats.map(c => (c._id === chat._id ? chat : c));
              }
              return [chat, ...prevChats];
            });
          }
          return;
        }
        default: {
          setError('Invalid chat update type');
        }
      }
    };

    fetchChats();

    socket.on('chatUpdate', handleChatUpdate);

    return () => {
      socket.off('chatUpdate', handleChatUpdate);
    };
  }, [user.username, socket, selectedChat?._id]);

  return {
    user,
    selectedChat,
    chatToCreate,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    userMap,
    handleUserSelect,
    handleCreateChat,
    error,
    searchTerm,
    setSearchTerm,
    searchResults,
    searchError,
    handleSearch,
    handleSearchResultClick,
    highlightedMessageId,
    messageRefs,
    spotifySharing,
    handleDirectChatWithFriend,
  };
};

export default useDirectMessage;
