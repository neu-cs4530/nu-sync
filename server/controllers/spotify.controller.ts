import express, { Request, Response, Router } from 'express';
import querystring from 'querystring';
import axios from 'axios';
import {
  FakeSOSocket,
} from '../types/types';
import UserModel from '../models/users.model';

const spotifyController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  const client_id: string = process.env.SPOTIFY_CLIENT_ID || '';
  const client_secret: string = process.env.SPOTIFY_CLIENT_SECRET || '';
  const redirect_uri = process.env.REDIRECT_URI;

  /**
   * Handles the initial authorization request of the spotify account.
   * @param req The request containing
   * @param res The response, returning.
   * @returns A promise resolving to void.
   */
  const initiateLogin = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.query;
    const state = `TEST:${username}`;
    const scope =
      'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';

    const redirectURI = `https://accounts.spotify.com/authorize?${querystring.stringify({
      response_type: 'code',
      client_id,
      scope,
      redirect_uri,
      state,
    })}`;

    res.redirect(redirectURI);
  };

  /**
   * Handles the callback request of the spotify account.
   * @param req The request containing
   * @param res The response, returning.
   * @returns A promise resolving to void.
   */
  const callbackFunc = async (req: Request, res: Response): Promise<void> => {

    const code = req.query.code || null;
    const state = req.query.state || null;
    const username = req.query.state?.toString().split(':')[1] || '';

    if (state === null) {
      res.redirect(
        `http://localhost:3000/home#${querystring.stringify({
          error: 'state_mismatch',
        })}`,
      );
      return;
    }

    try {
      // request access token
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify({
          code: code?.toString() || '',
          redirect_uri,
          grant_type: 'authorization_code',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
          },
        },
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // try to get user profile
      try {
        const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        // update user in database with spotify token info
        const updatedUser = await UserModel.findOneAndUpdate(
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

        // redirect to profile page
        res.redirect(
          `http://localhost:3000/user/${username}?spotify_data=${Buffer.from(
            JSON.stringify({
              access_token,
              refresh_token,
              expires_in,
              spotify_connected: 'true',
              spotify_user_id: profileResponse.data.id,
            }),
          ).toString('base64')}`,
        );
      } catch (error) {
        console.error('Error fetching profile:', error);
        res.redirect('http://localhost:3000/home?error=profile_error');
      }
    } catch (error) {
      console.error('Error during token exchange:', error);
      res.redirect('http://localhost:3000/home?error=invalid_token');
    }
  };

    /**
       * Handles disconnect request of the spotify account
       * @param req The request containing 
       * @param res The response, returning.
       * @returns A promise resolving to void.
       */
    const disconnectSpotify = async (req: Request, res: Response): Promise<void> => {
        const username = req.body.username;

        try {
            await UserModel.findOneAndUpdate(
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
        }
        catch (error) {
            res.status(500).json({ message: "Unable to update user data in backendwhile disconnecting from Spotify" });
        }
        
        res.clearCookie("spotifyAccessToken");
        res.clearCookie("spotifyRefreshToken");
        res.clearCookie("spotifyId");

        res.status(200).json({ message: "Spotify disconnected successfully" });
    };

  router.get('/auth/spotify', initiateLogin);
  router.get('/auth/callback', callbackFunc);
  router.patch('/disconnect', disconnectSpotify);
  return router;
};

export default spotifyController;
