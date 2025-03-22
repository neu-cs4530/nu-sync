import axios from 'axios';
import { UserCredentials, SafeDatabaseUser } from '../types/types';
import api from './config';

const SPOTIFY_API_URL = `${process.env.REACT_APP_SERVER_URL}/spotify`;

/**
 * Function to login with spotify
 *
 * @throws Error if there is an issue fetching users.
 */
const loginSpotify = async () => {
    // const res = await api.get(`http://localhost:8000/spotify/auth/spotify`);
    // if (res.status !== 200) {
    //     throw new Error('Error when fetching login route');
    // }
    // return res.data;

    // we use this because axios does not automatically allow for redirects
    window.location.href = `${SPOTIFY_API_URL}/auth/spotify`;
    // const currentPage = window.location.href; // Capture the current page URL
    // window.location.href = `http://localhost:8000/spotify/auth/spotify?redirect_uri=${encodeURIComponent(currentPage)}`;
};


export {
    loginSpotify
};
