import { ObjectId } from 'mongodb';
import { useEffect, useState } from 'react';
import {
  ChatUpdatePayload,
  Message,
  PopulatedDatabaseChat,
  SafeDatabaseUser,
} from '../types/types';
import useUserContext from './useUserContext';
import { createChat, getChatById, getChatsByUser, sendMessage } from '../services/chatService';
import { getSpotifyPlaylists } from '../services/spotifyService';

// type for spotify playlist
interface SpotifyPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: { url: string }[]; // Simplified - you can make it richer if you want
  name: string;
  owner: {
    display_name: string;
    external_urls: { spotify: string };
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  type: string;
  uri: string;
}

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
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[] | null>([]);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);

  const handleJoinChat = (chatID: ObjectId) => {
    socket.emit('joinChat', String(chatID));
  };

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

  const fetchSpotifyPlaylists = async () => {
    try {
      const allPlaylists = await getSpotifyPlaylists(user.username);
      setPlaylists(allPlaylists || []);
      setShowPlaylistDropdown(true);
    }
    catch (e) {
      setError('Error fetching Spotify playlists');
    }
  }

  const handleSendSpotifyPlaylist = async () => {

    if (!selectedPlaylist || !selectedChat?._id) {
      setError('Please select a playlist');
      return;
    }

    if (selectedChat?._id) {

      const allPlaylists = await getSpotifyPlaylists(user.username);
      setPlaylists(allPlaylists);

      const message: Omit<Message, 'type'> = {
        msg: `Check out this playlist: ${selectedPlaylist.name}\n${selectedPlaylist.external_urls.spotify}`,
        msgFrom: user.username,
        msgDateTime: new Date(),
      };

      const chat = await sendMessage(message, selectedChat._id);
      setSelectedChat(chat);
      setError(null);
      setSelectedPlaylist(null);
      setShowPlaylistDropdown(false);
    } else {
      setError('No chat selected');
    }
  }

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
    fetchSpotifyPlaylists,
    showPlaylistDropdown,
    playlists,
    selectedPlaylist,
    setSelectedPlaylist,
    handleSendSpotifyPlaylist,
    error,
  };
};

export default useDirectMessage;