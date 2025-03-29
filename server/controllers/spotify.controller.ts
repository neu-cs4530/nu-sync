import express, { Request, Response, Router } from 'express';
import querystring from 'querystring';
import axios from 'axios';
import { DatabaseUser, FakeSOSocket } from '../types/types';
import UserModel from '../models/users.model';

// ensures correct response format from spotify
interface SpotifyTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

const spotifyController = (socket: FakeSOSocket) => {
    const router: Router = express.Router();

    const clientId: string = process.env.SPOTIFY_CLIENT_ID || 'MISSING_SPOTIFY_CLIENT_ID';
    const clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET || 'MISSING_SPOTIFY_CLIENT_SECRET';
    const redirectUri = process.env.REDIRECT_URI || 'MISSING_REDIRECT_URI';
    const clientUrl = process.env.CLIENT_URL || 'MISSING_REDIRECT_URI';

    /**
     * Initiates the Spotify OAuth flow by redirecting the user to Spotify's authorization page, where user will be prompted to log in
     */
    const initiateLogin = async (req: Request, res: Response): Promise<void> => {
        const { username } = req.query;
        const state = `TEST:${username}`;
        const scope =
            'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';

        const spotifyAuthParams = {
            response_type: 'code',
            client_id: clientId,
            scope,
            redirect_uri: redirectUri,
            state,
        };

        res.redirect(`https://accounts.spotify.com/authorize?${querystring.stringify(spotifyAuthParams)}`);
    };

    /**
     * Handles callback from Spotify after user authorization
     */
    const callbackFunc = async (req: Request, res: Response): Promise<void> => {
        const code = req.query.code || null;
        const state = req.query.state || null;
        const username = req.query.state?.toString().split(':')[1] || '';

        if (!state) {
            res.redirect(`${clientUrl}/home#${querystring.stringify({ error: 'state_mismatch' })}`);
            return;
        }

        try {
            const tokenResponse = await axios.post<SpotifyTokenResponse>(
                'https://accounts.spotify.com/api/token',
                querystring.stringify({
                    code: code?.toString() || '',
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    },
                },
            );

            const { access_token, refresh_token, expires_in } = tokenResponse.data;

            try {
                const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
                    headers: { Authorization: `Bearer ${access_token}` },
                });

                await UserModel.findOneAndUpdate(
                    { username },
                    {
                        $set: {
                            spotifyId: profileResponse.data.id,
                            spotifyAccessToken: access_token,
                            spotifyRefreshToken: refresh_token,
                        },
                    },
                    { new: true },
                );

                const spotifyData = {
                    access_token,
                    refresh_token,
                    expires_in,
                    spotify_connected: 'true',
                    spotify_user_id: profileResponse.data.id,
                };

                res.redirect(`${clientUrl}/user/${username}?spotify_data=${Buffer.from(JSON.stringify(spotifyData)).toString('base64')}`);
            } catch (error) {
                res.status(500).send(`Error fetching Spotify user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } catch (error) {
            res.status(500).send(`Invalid Spotify access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    router.get('/login', initiateLogin);
    router.get('/callback', callbackFunc);

    return router;
};

export default spotifyController;