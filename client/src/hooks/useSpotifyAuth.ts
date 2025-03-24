import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useUserContext from './useUserContext';
import UserModel from '../../../server/models/users.model';
import axios from 'axios';

const useSpotifyAuth = () => {
    const { user } = useUserContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
    const [spotifyUserId, setSpotifyUserId] = useState<string | null>(null);

    // check connection state when user changes
    useEffect(() => {
        const checkSpotifyConnection = () => {
            if (user?.spotifyId) {
                setIsSpotifyConnected(true);
                setSpotifyUserId(user.spotifyId);
                return;
            }

            const accessToken = localStorage.getItem('spotify_access_token');
            const userId = localStorage.getItem('spotify_user_id');
            if (accessToken && userId) {
                setIsSpotifyConnected(true);
                setSpotifyUserId(userId);
                return;
            }

            setIsSpotifyConnected(false);
            setSpotifyUserId(null);
        };

        checkSpotifyConnection();
    }, [user]);

    useEffect(() => {
        const handleSpotifyCallback = async () => {
            const params = new URLSearchParams(location.search);
            const spotifyData = params.get('spotify_data');
            
            if (!spotifyData) {
                return;
            }

            try {
                const data = JSON.parse(Buffer.from(spotifyData, 'base64').toString());
                const {
                    access_token,
                    refresh_token,
                    spotify_user_id,
                    spotify_connected
                } = data;

                if (access_token && refresh_token && spotify_connected === 'true') {
                    console.log("Storing Spotify tokens and connection state...");

                    localStorage.setItem('spotify_access_token', access_token);
                    localStorage.setItem('spotify_refresh_token', refresh_token);
                    
                    if (spotify_user_id) {
                        localStorage.setItem('spotify_user_id', spotify_user_id);
                        setSpotifyUserId(spotify_user_id);
                    }

                    setIsSpotifyConnected(true);
                    const cleanUrl = location.pathname;
                    window.history.replaceState({}, '', cleanUrl);
                    return;
                }
            } catch (error) {
                console.error('Error processing Spotify data:', error);
                navigate('/');
            }
        };

        handleSpotifyCallback();
    }, [location, navigate]);

    const disconnect = async () => {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_user_id');
        setIsSpotifyConnected(false);
        setSpotifyUserId(null);


        if (user?.username) {

            try {
                await axios.patch('http://localhost:8000/spotify/disconnect', {
                    username: user.username
                });

            }
            catch (error) {
                console.error('Error disconnecting from Spotify:', error);
            }
            
        }
        
    };

    return {
        isSpotifyConnected,
        spotifyUserId,
        disconnect
    };
};

export default useSpotifyAuth; 