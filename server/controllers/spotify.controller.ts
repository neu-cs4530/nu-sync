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
  const clientUrl = process.env.CLIENT_URI || 'MISSING_REDIRECT_URI';

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
    console.log('REDIRECT_URI being used:', redirectUri);
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
        `${clientUrl}/home#${querystring.stringify({
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
          `${clientUrl}/user/${username}?spotify_data=${Buffer.from(
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

  /**
   * Refreshes a user's Spotify access token using their stored refresh token
   */
  const refreshSpotifyToken = async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      // 1. Fetch the user from DB
      const userDoc = await UserModel.findOne({ username });
      if (!userDoc) {
        return res.status(404).json({ error: 'User not found' });
      }
      const user = userDoc as unknown as DatabaseUser;

      // 2. Check if the user has a stored refresh token
      const refreshToken = user.spotifyRefreshToken;
      if (!refreshToken) {
        return res.status(400).json({ error: 'No Spotify refresh token stored for this user' });
      }

      // 3. Request a new access token from Spotify
      const tokenParams = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      };

      const spotifyResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(tokenParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
        },
      );

      // 4. Update tokens if new ones were returned
      const newAccessToken = spotifyResponse.data.access_token;
      const newRefreshToken = spotifyResponse.data.refresh_token;
      // Spotify may not always return a new refresh token

      // 5. Update the database
      const updateFields: { spotifyAccessToken: string; spotifyRefreshToken?: string } = {
        spotifyAccessToken: newAccessToken,
      };
      if (newRefreshToken) {
        updateFields.spotifyRefreshToken = newRefreshToken;
      }

      await UserModel.findOneAndUpdate(
        { username },
        {
          $set: updateFields,
        },
        { new: true },
      );

      // 6. Return the updated tokens (or handle as needed)
      return res.json({
        access_token: newAccessToken,
        refresh_token: newRefreshToken || refreshToken,
        message: 'Spotify access token refreshed successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Unknown error refreshing Spotify token' });
    }
  };

  router.get('/auth/spotify', initiateLogin);
  router.get('/auth/callback', callbackFunc);
  router.patch('/disconnect', disconnectSpotify);
  router.post('/auth/refresh', refreshSpotifyToken);
  return router;
};

export default spotifyController;
