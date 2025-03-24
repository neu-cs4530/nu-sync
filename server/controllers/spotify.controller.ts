import express, { Request, Response, Router } from 'express';
import {
    UserRequest,
    UserCredentials,
    UserByUsernameRequest,
    FakeSOSocket,
    UpdateBiographyRequest,
    GetMutualFriendsRequest,
    SafeDatabaseUser
} from '../types/types';
import querystring from 'querystring';
import axios from 'axios';
import UserModel from '../models/users.model';

const spotifyController = (socket: FakeSOSocket) => {
    const router: Router = express.Router();

    const client_id: string = process.env.SPOTIFY_CLIENT_ID || ''
    // console.log(client_id)
    const client_secret: string = process.env.SPOTIFY_CLIENT_SECRET || ''
    const redirect_uri = process.env.REDIRECT_URI

    /**
     * Handles the initial authorization request of the spotify account.
     * @param req The request containing 
     * @param res The response, returning.
     * @returns A promise resolving to void.
     */
    const initiateLogin = async (req: Request, res: Response): Promise<void> => {
        const username = req.query.username;
        const state = `TEST:${username}`; 
        var scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';

        const redirectURI = 'https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
                state: state
            });

        console.log("Starting Spotify auth with redirect URI:", redirect_uri);
        console.log("Full authorization URL:", redirectURI);
        console.log("Username in state:", username);

        res.redirect(redirectURI);
    };


    /**
     * Handles the callback request of the spotify account.
     * @param req The request containing 
     * @param res The response, returning.
     * @returns A promise resolving to void.
     */
    const callbackFunc = async (req: Request, res: Response): Promise<void> => {
        console.log("Received callback from Spotify");
        console.log("Query params:", req.query);
        
        const code = req.query.code || null;
        const state = req.query.state || null;
        const username = req.query.state?.toString().split(':')[1] || '';
        console.log("Username from state:", username);

        if (state === null) {
            console.log("State mismatch error");
            res.redirect('http://localhost:3000/home#' + 
                querystring.stringify({
                    error: 'state_mismatch'
                }));
            return;
        }

        try {
            console.log("Exchanging code for tokens...");
            // request access token
            const tokenResponse = await axios.post(
                'https://accounts.spotify.com/api/token',
                querystring.stringify({
                    code: code?.toString() || '',
                    redirect_uri: redirect_uri,
                    grant_type: 'authorization_code'
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
                    }
                }
            );

            console.log("Successfully got tokens");
            const { access_token, refresh_token, expires_in } = tokenResponse.data;

            // try to get user profile
            try {
                console.log("Fetching user profile...");
                const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                });
                console.log("Got user profile:", profileResponse.data.id);

                // update user in database with spotify token info
                const updatedUser = await UserModel.findOneAndUpdate(
                    { username },
                    {
                        $set: {
                            spotifyId: profileResponse.data.id,
                            spotifyAccessToken: access_token,
                            spotifyRefreshToken: refresh_token
                        }
                    },
                    { new: true }
                );

                console.log("Updated user:", updatedUser);


                // redirect to profile page
                res.redirect(`http://localhost:3000/user/${username}?spotify_data=${Buffer.from(JSON.stringify({
                    access_token,
                    refresh_token,
                    expires_in,
                    spotify_connected: 'true',
                    spotify_user_id: profileResponse.data.id
                })).toString('base64')}`);

            } catch (error) {
                console.error("Error fetching profile:", error);
                res.redirect('http://localhost:3000/home?error=profile_error');
            }
        } catch (error) {
            console.error('Error during token exchange:', error);
            res.redirect('http://localhost:3000/home?error=invalid_token');
        }
    };


    /**
     * Handles the disconnect request of the spotify account.
     * @param req The request containing 
     * @param res The response, returning.
     * @returns A promise resolving to void.
     */
    const disconnectSpotify = async (req: Request, res: Response): Promise<void> => {
        const username = req.body.username;
        console.log("Username:", username);
        const updatedUser = await UserModel.findOneAndUpdate(
            { username },
            {
                $set: {
                    spotifyId: "",
                    spotifyAccessToken: "",
                    spotifyRefreshToken: ""
                }
            },
            { new: true }
        );

        console.log("Updated user:", updatedUser);
    };

    router.get('/auth/spotify', initiateLogin);
    router.get('/auth/callback', callbackFunc);
    router.patch('/disconnect', disconnectSpotify);
    return router;
};

export default spotifyController;
