import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './layout';
import Login from './auth/login';
import { FakeSOSocket, SafeDatabaseUser } from '../types/types';
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

  // update user data if needed
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <LoginContext.Provider value={{ setUser }}>
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
    </LoginContext.Provider>
  );
};

export default FakeStackOverflow;
