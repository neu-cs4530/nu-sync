import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './layout';
import Login from './auth/login';
import {
  FakeSOSocket,
  SafeDatabaseUser,
  FriendRequestUpdatePayload,
  ChatUpdatePayload,
} from '../types/types';
import LoginContext from '../contexts/LoginContext';
import UserContext from '../contexts/UserContext';
import QuestionPage from './main/questionPage';
import TagPage from './main/tagPage';
import NewQuestionPage from './main/newQuestion';
import NewAnswerPage from './main/newAnswer';
import AnswerPage from './main/answerPage';
import MessagingPage from './main/messagingPage';
import DirectMessage from './main/directMessage';
import Signup from './auth/signup';
import UsersListPage from './main/usersListPage';
import ProfileSettings from './profileSettings';
import AllGamesPage from './main/games/allGamesPage';
import GamePage from './main/games/gamePage';
import FriendsListPage from './main/friendsListPage';
import FriendRequestPage from './main/friendRequestPage/friendRequestPage';
import NotificationContext, {
  Notification,
} from '../contexts/NotificationContext';
import NotificationContainer from './main/notifications/NotificationContainer';
import { getChatsByUser } from '../services/chatService';

const ProtectedRoute = ({
  user,
  socket,
  children,
}: {
  user: SafeDatabaseUser | null;
  socket: FakeSOSocket | null;
  children: JSX.Element;
}) => {
  const location = useLocation();
  const storedUser = localStorage.getItem('user');
  const isSpotifyCallback = location.search.includes('spotify_data');

  // If no user data at all, redirect to login
  if (!user && !storedUser) {
    return <Navigate to="/" />;
  }

  // For Spotify callback, redirect to user profile
  if (isSpotifyCallback) {
    const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
    if (currentUser) {
      return <Navigate to={`/user/${currentUser.username}`} replace />;
    }
  }

  // Normal case - require both user and socket
  if (user && socket) {
    return (
      <UserContext.Provider value={{ user, socket }}>
        {children}
      </UserContext.Provider>
    );
  }

  // Default case - redirect to login
  return <Navigate to="/" />;
};


const shouldShowNotification = (user: SafeDatabaseUser, senderUsername: string): boolean => {
  const { status, busySettings } = user.onlineStatus || {};

  // console.log('[notif check]', { status, busySettings });

  if (status === 'online' || status === 'away') return true;
  if (status === 'invisible') return false;

  if (status === 'busy') {
    if (busySettings?.muteScope === 'everyone') return false;
    if (busySettings?.muteScope === 'friends-only') {
      return user.friends?.includes(senderUsername) ?? false;
    }
  }

  return true;
};


/**
 * Represents the main component of the application.
 * It manages the state for search terms and the main title.
 */
const FakeStackOverflow = ({ socket }: { socket: FakeSOSocket | null }) => {
  const [user, setUser] = useState<SafeDatabaseUser | null>(() => {
    // gets user data from local storage
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket && user?.username) {
        socket.emit('logout_user', user.username);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket, user]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newNotification = { ...notification, id };

      setNotifications((prev) => [newNotification, ...prev]);

      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    },
    [removeNotification],
  );

  // update user data if needed
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);
  

  useEffect(() => {
    if (user?.username && socket) {
      socket.emit('connect_user', user.username);
      // console.log('Sent connect_user event for', user.username);
    }
  }, [user?.username, socket]);

  useEffect(() => {
    if (!user || !socket) return;

    const joinAllUserChats = async () => {
      try {
        const chats = await getChatsByUser(user.username);

        for (const chat of chats) {
          socket.emit('joinChat', String(chat._id));
        }
      } catch (err) {
        // console.error('Failed to join chat rooms:', err);
      }
    };

    joinAllUserChats();
  }, [user, socket]);


  useEffect(() => {
    if (!socket || !user) return () => {};

    const handleFriendRequestUpdate = (payload: FriendRequestUpdatePayload) => {
      const { friendRequest, type } = payload;

      // New friend request received on private account
      if (
        type === 'created' &&
        friendRequest.recipient.username === user.username
      ) {
        if (friendRequest.status === 'accepted') {
          addNotification({
            message: `${friendRequest.requester.username} added you as a friend`,
            link: '/friends',
          });
        } else {
          // Normal pending request (private profile)
          addNotification({
            message: `${friendRequest.requester.username} sent you a friend request`,
            link: '/requests',
          });
        }
      }
      // Friend request accepted
      else if (
        type === 'updated' &&
        friendRequest.status === 'accepted' &&
        friendRequest.requester.username === user.username
      ) {
        if (shouldShowNotification(user, friendRequest.recipient.username)) {
          addNotification({
            message: `${friendRequest.recipient.username} accepted your friend request`,
            link: '/friends',
          });
        }
      }
    };

    const handleChatUpdate = (payload: ChatUpdatePayload) => {
      const { chat, type } = payload;

      if (type === 'created') {
        if (chat.participants.includes(user.username)) {
          socket.emit('joinChat', String(chat._id));
        }
        return;
      }

      if (type === 'newMessage') {
        const lastMessage = chat.messages[chat.messages.length - 1];
        const fromUser = lastMessage.msgFrom;

        if (fromUser !== user.username && shouldShowNotification(user, fromUser)) {
          addNotification({
            message: `New message from ${fromUser}`,
            link: '/messaging/direct-message',
          });
        }
      }
    };

    const handleUserUpdate = (payload: { user: SafeDatabaseUser; type: string }) => {
      if (payload.user.username === user.username) {
        // console.log('Updating user status from socket:', payload.user.onlineStatus);
        setUser(payload.user);
      }
    };

    socket.on('friendRequestUpdate', handleFriendRequestUpdate);
    socket.on('chatUpdate', handleChatUpdate);
    socket.on('userUpdate', handleUserUpdate);
    
    return () => {
      socket.off('friendRequestUpdate', handleFriendRequestUpdate);
      socket.off('chatUpdate', handleChatUpdate);
      socket.off('userUpdate', handleUserUpdate);
    };
  }, [socket, user, addNotification]);

  return (
    <LoginContext.Provider value={{ setUser }}>
      <NotificationContext.Provider
        value={{
          notifications,
          addNotification,
          removeNotification,
        }}
      >
        {user && socket && <NotificationContainer />}

        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Protected Routes */}
          {
            <Route
              element={
                <ProtectedRoute user={user} socket={socket}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/home" element={<QuestionPage />} />
              <Route path="tags" element={<TagPage />} />
              <Route path="/messaging" element={<MessagingPage />} />
              <Route
                path="/messaging/direct-message"
                element={<DirectMessage />}
              />
              <Route path="/question/:qid" element={<AnswerPage />} />
              <Route path="/new/question" element={<NewQuestionPage />} />
              <Route path="/new/answer/:qid" element={<NewAnswerPage />} />
              <Route path="/users" element={<UsersListPage />} />
              <Route path="/user/:username" element={<ProfileSettings />} />
              <Route path="/games" element={<AllGamesPage />} />
              <Route path="/games/:gameID" element={<GamePage />} />
              <Route path="/friends" element={<FriendsListPage />} />
              <Route path="/requests" element={<FriendRequestPage />} />
            </Route>
          }
        </Routes>
      </NotificationContext.Provider>
    </LoginContext.Provider>
  );
};

export default FakeStackOverflow;
