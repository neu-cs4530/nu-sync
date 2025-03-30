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



/**
 * useDirectMessage is a custom hook that provides state and functions for direct messaging between users.
 * It includes a selected user, messages, and a new message state.
 */

const useDirectMessage = () => {
  const { user, socket } = useUserContext();
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  const [chatToCreate, setChatToCreate] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<PopulatedDatabaseChat | null>(null);
  const [chats, setChats] = useState<PopulatedDatabaseChat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [highlightedMessageId, setHighlightedMessageId] = useState<ObjectId | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);
  const [searchError, setSearchError] = useState('');

  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleJoinChat = (chatID: ObjectId) => {
    socket.emit('joinChat', String(chatID));
  };

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
    if (!chatToCreate) {
      setError('Please select a user to chat with');
      return;
    }

    const chat = await createChat([user.username, chatToCreate]);
    setSelectedChat(chat);
    handleJoinChat(chat._id);
    setShowCreatePanel(false);
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
      socket.emit('leaveChat', String(selectedChat?._id));
    };
  }, [user.username, socket, selectedChat?._id]);

  return {
    selectedChat,
    chatToCreate,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
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
  };
};

export default useDirectMessage;