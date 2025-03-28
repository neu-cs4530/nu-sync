import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import useUserContext from './useUserContext';
import useLoginContext from './useLoginContext';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'errrrr';

const useSpotifyAuth = () => {
  const { user } = useUserContext();
  const { setUser } = useLoginContext();
  const location = useLocation();
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifyUserId, setSpotifyUserId] = useState<string | null>(null);

  // we use location in the useEffect so that everytime the URL changes when redirected from spotify, user information is synced
  useEffect(() => {
    const syncSpotifyData = async () => {
      // check if user exists
      if (!user?.username) {
        return;
      }

      try {
        const updatedUserResponse = await axios.get(`${SERVER_URL}/user/getUser/${user.username}`);
        const updatedUser = updatedUserResponse.data;

        // update user context
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        if (updatedUser.spotifyId && updatedUser.spotifyAccessToken) {
          setIsSpotifyConnected(true);
          setSpotifyUserId(updatedUser.spotifyId);
          localStorage.setItem('spotify_user_id', updatedUser.spotifyId);
          localStorage.setItem('spotify_access_token', updatedUser.spotifyAccessToken);
          localStorage.setItem('spotify_refresh_token', updatedUser.spotifyRefreshToken);
        } else {
          setIsSpotifyConnected(false);
          setSpotifyUserId(null);
          localStorage.removeItem('spotify_user_id');
          localStorage.removeItem('spotify_access_token');
          localStorage.removeItem('spotify_refresh_token');
        }
      } catch (error) {
        // error handled
      }
    };

    syncSpotifyData();
  }, [location, user?.username, setUser]);

  const disconnect = async () => {
    try {
      await axios.patch(`${SERVER_URL}/spotify/disconnect`, {
        username: user.username,
      });

      const updatedUser = {
        ...user,
        spotifyId: '',
        spotifyAccessToken: '',
        spotifyRefreshToken: '',
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setIsSpotifyConnected(false);
      setSpotifyUserId(null);
      localStorage.removeItem('spotify_user_id');
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_refresh_token');
    } catch (error) {
      // error handled
    }
  };

  return {
    isSpotifyConnected,
    spotifyUserId,
    disconnect,
  };
};

export default useSpotifyAuth;
