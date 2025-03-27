import express, { Request, Response, Router } from 'express';
import querystring from 'querystring';
import axios from 'axios';
import { FakeSOSocket } from '../types/types';
import UserModel from '../models/users.model';

// ensures correct response format from spotify
interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const spotifyController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  const clientId: string = process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET || '';
  const redirectUri = process.env.REDIRECT_URI;

  /**
   * Initiates the Spotify OAuth flow by redirecting the user to Spotify's authorization page, where user will be prompted to log in
   *
   * @param req The HTTP request object containing the username in query parameters
   * @param res The HTTP response object for redirecting to Spotify's auth page
   *
   * @returns A Promise that resolves to void.
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

    // redirects user to spotify login page
    const redirectUrl = `https://accounts.spotify.com/authorize?${querystring.stringify(spotifyAuthParams)}`;
    res.redirect(redirectUrl);
  };

  /**
   * Handles callback from Spotify after user authorization
   * Exchanges the authorization code for access tokens and fetches user's Spotify profile
   *
   * @param req The HTTP request object containing the authorization code and state from Spotify
   * @param res The HTTP response object for redirecting back to the application
   *
   * @returns A Promise that resolves to void.
   */
  const callbackFunc = async (req: Request, res: Response): Promise<void> => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const username = req.query.state?.toString().split(':')[1] || '';

    // verifies the state is correct
    if (state === null) {
      res.redirect(
        `http://localhost:3000/home#${querystring.stringify({
          error: 'state_mismatch',
        })}`,
      );
      return;
    }

    // requests access token from spotify
    try {
      const tokenParams = {
        code: code?.toString() || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      };

      const tokenResponse = await axios.post<SpotifyTokenResponse>(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(tokenParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
        },
      );

      const accessToken = tokenResponse.data.access_token;
      const refreshToken = tokenResponse.data.refresh_token;
      const expiresIn = tokenResponse.data.expires_in;

      // exchanges access token for user profile
      try {
        const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // updates user in database with spotify info
        await UserModel.findOneAndUpdate(
          { username },
          {
            $set: {
              spotifyId: profileResponse.data.id,
              spotifyAccessToken: accessToken,
              spotifyRefreshToken: refreshToken,
            },
          },
          { new: true },
        );

        const spotifyData = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn,
          spotify_connected: 'true',
          spotify_user_id: profileResponse.data.id,
        };

        res.redirect(
          `http://localhost:3000/user/${username}?spotify_data=${Buffer.from(
            JSON.stringify(spotifyData),
          ).toString('base64')}`,
        );
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).send(`Error when fetching spotify user profile: ${error.message}`);
        } else {
          res.status(500).send(`Error when fetching spotify user profile`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send(`Invalid spotify access token: ${error.message}`);
      } else {
        res.status(500).send(`Invalid spotify access token`);
      }
    }
  };

  /**
   * Disconnects current user's Spotify account by removing their stored information in the database and frontend
   *
   * @param req The HTTP request object containing the username in the request body
   * @param res The HTTP response object used to send the status of the function
   *
   * @returns A Promise that resolves to void.
   */
  const disconnectSpotify = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.body;

    try {
      await UserModel.findOneAndUpdate(
        { username },
        {
          $set: {
            spotifyId: '',
            spotifyAccessToken: '',
            spotifyRefreshToken: '',
          },
        },
        { new: true },
      );
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          message: `Unable to update user data in backend while disconnecting from Spotify: ${error.message}`,
        });
      } else {
        res.status(500).json({
          message: `Unable to update user data in backend while disconnecting from Spotify`,
        });
      }
    }

    res.clearCookie('spotifyAccessToken');
    res.clearCookie('spotifyRefreshToken');
    res.clearCookie('spotifyId');

    res.status(200).json({ message: 'Spotify disconnected successfully' });
  };

  router.get('/auth/spotify', initiateLogin);
  router.get('/auth/callback', callbackFunc);
  router.patch('/disconnect', disconnectSpotify);
  return router;
};

export default spotifyController;
