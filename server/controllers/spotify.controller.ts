import express, { Request, Response, Router } from 'express';
import querystring from 'querystring';
import axios, { AxiosError } from 'axios';
import { DatabaseUser, FakeSOSocket } from '../types/types';
import UserModel from '../models/users.model';
import { SpotifyTokenResponse } from '../types/spotify';
import isSpotifyLinkedToAnotherUser from "../services/spotify.service"
// import generateHintGemini from '../services/gemini.service';
import generateHintPerplexity from '../services/perplexity.service';
import generateHintGemini from '../services/gemini.service';

const spotifyController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  const clientId: string = process.env.SPOTIFY_CLIENT_ID || 'MISSING_SPOTIFY_CLIENT_ID';
  const clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET || 'MISSING_SPOTIFY_CLIENT_SECRET';
  const redirectUri = process.env.REDIRECT_URI || 'MISSING_REDIRECT_URI';
  const clientUrl = process.env.CLIENT_URL || 'MISSING_REDIRECT_URI';

  /**
   * Initiates the Spotify OAuth flow by redirecting the user to Spotify's authorization page, where user will be prompted to log in
   *
   * @param req The HTTP request object containing the username in query parameters
   * @param res The HTTP response object for redirecting to Spotify's auth page
   * @returns A Promise that resolves to void.
   */
  const initiateLogin = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.query;
    const state = `TEST:${username}`;
    const scope =
      'user-top-read user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';

    const spotifyAuthParams = {
      response_type: 'code',
      client_id: clientId,
      scope,
      redirect_uri: redirectUri,
      state,
      show_dialog: true,
    };

    try {
      // redirects user to spotify login page
      const redirectUrl = `https://accounts.spotify.com/authorize?${querystring.stringify(spotifyAuthParams)}`;
      res.redirect(redirectUrl);
      
    } catch (error) {
      res.status(500).send("Error logging into Spotify")
      
    }
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
    const code = req.query.code?.toString() || null;
    const state = req.query.state?.toString() || null;
    const username = state?.split(':')[1] || '';

    if (!state || !code || !username) {
      res.redirect(
        `${clientUrl}/home#${querystring.stringify({
          error: 'state_mismatch_or_missing_data',
        })}`,
      );
      return;
    }

    try {
      const tokenParams = {
        code,
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

      const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const spotifyId = profileResponse.data.id;

      const alreadyLinked = await isSpotifyLinkedToAnotherUser(spotifyId, username);

      if (alreadyLinked) {
        await UserModel.findOneAndUpdate(
          { username },
          {
            $set: {
              spotifyConflictTemp: true,
              spotifyConflictUserId: spotifyId,
            },
          },
        );
      } else {
        const updatedUser = await UserModel.findOneAndUpdate(
          { username },
          {
            $set: {
              spotifyId,
              spotifyAccessToken: accessToken,
              spotifyRefreshToken: refreshToken,
              spotifyConflictTemp: false,
              spotifyConflictUserId: null,
            },
          },
          { new: true },
        );

        if (!updatedUser) {
          res.status(404).send(`User "${username}" not found in database.`);
          return;
        }
      }

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
        res.status(500).send(`Invalid spotify access token: ${error.message}`);
      } else {
        res.status(500).send(`Invalid spotify access token`);
      }
    }
  };


  const getSpotifyConflictUserId = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;

    try {
      const user = await UserModel.findOne({ username });
      if (!user || !user.spotifyConflictTemp || !user.spotifyConflictUserId) {
        res.status(404).send({ error: 'No Spotify conflict data available' });
        return;
      }

      res.send({ spotifyUserId: user.spotifyConflictUserId });
    } catch (err) {
      // console.error('Error fetching conflict user ID:', err);
      res.status(500).send({ error: 'Failed to get Spotify user ID' });
    }
  };

  /**
   * Fetches tracks from a specified Spotify playlist using the access token.
   * @param req The HTTP request containing playlistId, access_token, and optional params like limit and offset.
   * @param res The HTTP response returning the list of playlist tracks or an error message.
   */
  const getPlaylistTracks = async (req: Request, res: Response): Promise<void> => {
    const { playlistId, access_token: accessToken, limit = 20, offset = 0, market } = req.query;

    if (!playlistId || !accessToken) {
      res.status(400).json({ error: 'Missing playlistId or access_token' });
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (market) queryParams.append('market', market.toString());

      const spotifyRes = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      res.status(200).json({ tracks: spotifyRes.data.items });
    } catch (error) {
      res.status(500).json({
        message: `Failed to fetch playlist tracks: ${(error as Error).message}`,
      });
    }
  };

  /**
   * Fetches the currently playing track from the user's Spotify account.
   * @param req The HTTP request containing the username as a query parameter.
   * @param res The HTTP response returning track details or an error message.
   */
  const getCurrentlyPlaying = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Username is required in query params' });
      return;
    }

    try {
      const userDoc = await UserModel.findOne({ username });
      if (!userDoc) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const accessToken = userDoc.spotifyAccessToken;

      try {
        const nowPlayingResponse = await axios.get(
          'https://api.spotify.com/v1/me/player/currently-playing',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (nowPlayingResponse.status === 204 || !nowPlayingResponse.data) {
          res.status(200).json({ isPlaying: false });
          return;
        }
        const { data } = nowPlayingResponse;
        const isPlaying = data.is_playing === true;
        res.status(200).json({
          isPlaying,
          track: data.item,
          progress_ms: data.progress_ms,
          timestamp: data.timestamp,
        });
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).json({
            message: `Failed to fetch currently playing track: ${error.message}`,
          });
        } else {
          res.status(500).json({
            message: `Unknown error occurred while fetching currently playing track.`,
          });
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          message: `Error retrieving user from database: ${error.message}`,
        });
      } else {
        res.status(500).json({
          message: `Unknown error occurred while checking current track.`,
        });
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
          $unset: {
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
      return;
    }

    res.clearCookie('spotifyAccessToken');
    res.clearCookie('spotifyRefreshToken');
    res.clearCookie('spotifyId');

    res.status(200).json({ message: 'Spotify disconnected successfully' });
  };

  /**
   * Refreshes the user's Spotify access token using the stored refresh token.
   * Updates the access token (and possibly refresh token) in the database.
   * @param req The HTTP request containing the username in the body.
   * @param res The HTTP response returning the new tokens or an error message.
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

  /**
   * Retrieves the list of Spotify playlists for a given user using their access token.
   * Automatically refreshes the token if expired and retries once.
   * @param req The HTTP request containing the username in the body.
   * @param res The HTTP response returning the playlists or an error message.
   */
  const getSpotifyPlaylists = async (req: Request, res: Response) => {
    const { username } = req.body;
    // console.log('Received playlist request for username:', username);

    try {
      const userDoc = await UserModel.findOne({ username });
      // console.log('Fetched userDoc:', userDoc);
      if (!userDoc) {
        return res.status(404).json({ error: 'User not found' });
      }

      const accessToken = userDoc.spotifyAccessToken;
      // console.log('Using accessToken:', accessToken);

      try {
        const playlistResponse = await axios.get(`https://api.spotify.com/v1/me/playlists`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        return res.status(200).json(playlistResponse.data.items);
      } catch (error) {
        const axiosError = error as AxiosError;

        if (axiosError.response?.status === 401) {
          // Token expired - refresh it
          const refreshRes = await axios.post(
            'https://accounts.spotify.com/api/token',
            querystring.stringify({
              grant_type: 'refresh_token',
              refresh_token: userDoc.spotifyRefreshToken,
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
              },
            },
          );

          const newAccessToken = refreshRes.data.access_token;
          await UserModel.updateOne({ username }, { $set: { spotifyAccessToken: newAccessToken } });

          // Retry original request
          const retryResponse = await axios.get(`https://api.spotify.com/v1/me/playlists`, {
            headers: {
              Authorization: `Bearer ${newAccessToken}`,
            },
          });

          return res.status(200).json(retryResponse.data.items);
        }
        if (axiosError.response?.status === 429) {
          const retryAfter = axiosError.response.headers['retry-after'];
          // console.warn(`Rate limited by Spotify. Retry after ${retryAfter} seconds.`);

          return res.status(429).json({
            error: 'Rate limited by Spotify. Try again later.',
            retry_after: retryAfter,
            raw_spotify_error: axiosError.response.data,
          });
        }
        throw error;
      }
    } catch (err) {
      // console.error('Error in getSpotifyPlaylists:', err);
      return res.status(500).json({ error: 'Error fetching Spotify playlists' });
    }
  };

  /**
   * Checks if the user has Spotify connected and if something is currently playing.
   * @param req The HTTP request containing the username as a query parameter.
   * @param res The HTTP response returning connection and playback status.
   */
  const checkSpotifyConnection = async (req: Request, res: Response) => {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required in query params' });
    }

    try {
      const userDoc = await UserModel.findOne({ username });
      if (!userDoc) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userDoc.toObject();

      const isConnected =
        !!user.spotifyAccessToken && !!user.spotifyRefreshToken && !!user.spotifyId;

      if (!isConnected) {
        return res.json({ isConnected: false, currentlyPlaying: false });
      }

      try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            Authorization: `Bearer ${user.spotifyAccessToken}`,
          },
        });

        const isPlaying = response.status === 200 && response.data?.is_playing;
        return res.json({ isConnected: true, currentlyPlaying: isPlaying || false });
      } catch (err) {
        return res.json({ isConnected: true, currentlyPlaying: false });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to check Spotify connection' });
    }
  };

  /**
   * Searches for a song on Spotify
   *
   * @param req The HTTP request object containing the access token and query (song name) in the request body
   * @param res The HTTP response object used to send the status of the function
   *
   * * */
  const searchSpotifySong = async (req: Request, res: Response) => {
    try {
      const { access_token: accessToken, query } = req.body;

      const searchResponse = await axios.get(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      res.status(200).json(searchResponse.data.tracks.items[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error searching Spotify songs controller' });
    }
  };

  /**
   * Searches for a playlist containing a specified song on Spotify
   *
   * @param req The HTTP request object containing the access token and query (song name) in the request body
   * @param res The HTTP response object used to send the status of the function
   *
   * * */
  const searchSpotifyPlaylistWithSong = async (req: Request, res: Response) => {
    try {
      const { access_token: accessToken, query } = req.body;

      if (!accessToken || !query) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const encodedQuery = encodeURIComponent(query);
      const searchResponse = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodedQuery}&type=playlist&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const items = (
        searchResponse.data.playlists.items as SpotifyApi.PlaylistObjectSimplified[]
      ).filter(playlist => playlist !== null);

      return res.status(200).json({ items });
    } catch (error) {
      return res.status(500).json({
        error: 'Error searching for Spotify playlists',
      });
    }
  };

  /**
   * Fetches the songs from a Spotify playlist
   *
   * @param req The HTTP request object containing the access token and playlist ID in the request body
   * @param res The HTTP response object used to send the status of the function
   *
   * * */
  const getSongsFromSpotifyPlaylist = async (req: Request, res: Response) => {
    try {
      const { access_token: accessToken, playlistId } = req.body;

      const searchResponse = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const modifiedResponse = searchResponse.data.items;

      res.status(200).json(modifiedResponse);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching Spotify songs from playlist Controller' });
    }
  };

  /**
   * Disconnects a Spotify account from all users who have linked it.
   * Expects the Spotify user ID in the request body.
   *
   * @param req The HTTP request containing spotify_user_id in the body.
   * @param res The HTTP response returning the result of the operation.
   */
  const disconnectSpotifyFromAllAccounts = async (req: Request, res: Response): Promise<void> => {
    const { spotifyUserId } = req.body;

    if (!spotifyUserId || typeof spotifyUserId !== 'string') {
      res.status(400).json({ error: 'spotifyUserId is required in the request body' });
      return;
    }

    try {
      const result = await UserModel.updateMany(
        { spotifyId: spotifyUserId },
        {
          $set: {
            spotifyId: null,
            spotifyAccessToken: '',
            spotifyRefreshToken: '',
          },
        },
      );

      res.status(200).json({
        message: `Disconnected Spotify account from ${result.modifiedCount} user(s).`,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: `Failed to disconnect Spotify from all accounts: ${message}` });
    }
  };

  /**
   * Checks if there was a Spotify conflict for this user
   * and resets the flag after reading.
   */
   const getSpotifyConflictStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      const user = await UserModel.findOne({ username });
      if (!user) {
        res.status(404).send({ error: 'User not found' });
        return;
      }

      const conflict = !!user.spotifyConflictTemp;

      if (conflict) {
        user.spotifyConflictTemp = false;
        await user.save();
      }

      res.send({
        conflict,
        spotifyUserId: conflict ? user.spotifyConflictUserId : null,
      });
    } catch (err) {
      res.status(500).send({ error: 'Failed to fetch conflict status' });
    }
  };


  /**
   * Gets a user's top tracks
   *
   * @param req The HTTP request object
   * @param res The HTTP response object used to send the status of the function
   *
   * * */
  const getSpotifyTopArtists = async (req: Request, res: Response) => {
    try {
      const { access_token: accessToken } = req.body;

      const searchResponse = await axios.get(
        `https://api.spotify.com/v1/me/top/artists`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      res.status(200).json(searchResponse.data);
    } catch (error) {
      res.status(500).json({ error: 'Error getting top artists for current user' });
    }
  };

  /**
  * Gets a specific user's spotify access token
  *
  * @param req The HTTP request object
  * @param res The HTTP response object used to send the status of the function
  *
  * * */
  const getSpotifyAccessToken = async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const user = await UserModel.findOne({ username });

      if (!user) {
        res.status(404).json({ error: 'User for given username not found' });
        return;
      }

      if (!user.spotifyAccessToken) {
        res.status(404).json({ error: 'No valid spotify access token found for this user' });
        return;
      }

      res.status(200).json({ accessToken: user.spotifyAccessToken });
    } catch (error) {
      res.status(500).json({ error: 'Error getting top artists for current user' });
    }
  };

  /**
   * Generates a random track and hint for the Spotify music guessing game
   *
   * @param req The HTTP request object containing the access token in the request body
   * @param res The HTTP response object used to send the status of the function
   *
   * * */
  const generateRandomTrackAndHint = async (req: Request, res: Response) => {
    try {
      const { accessToken, llm = 'gemini' } = req.body;

      const topTracksResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks?limit=50', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const tracks = topTracksResponse.data.items;

      if (!tracks || tracks.length === 0) {
        return res.status(404).json({ error: 'No top tracks found for this user.' });
      }

      // get random track from top tracks
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      const songName = randomTrack.name;
      const artistName = randomTrack.artists[0]?.name || 'Unknown Artist';

      let hint;

      if (llm === 'gemini') {
        hint = await generateHintGemini(songName, artistName);
      }
      else {
        hint = await generateHintPerplexity(songName, artistName);
      }

      return res.status(200).json({
        songName,
        artistName,
        hint,
      });
      
      
    } catch (err) {
      return res.status(500).json({ error: 'Failed to generate track and hint' });
    }
  };


  router.get('/auth/spotify', initiateLogin);
  router.get('/auth/callback', callbackFunc);
  router.patch('/disconnect', disconnectSpotify);
  router.post('/auth/refresh', refreshSpotifyToken);
  router.post('/getPlaylists', getSpotifyPlaylists);
  router.get('/getPlaylistTracks', getPlaylistTracks);
  router.get('/isConnected', checkSpotifyConnection);
  router.get('/current-track', getCurrentlyPlaying);
  router.post('/searchSong', searchSpotifySong);
  router.post('/searchSpotifyPlaylistWithSong', searchSpotifyPlaylistWithSong);
  router.post('/getSongsFromSpotifyPlaylist', getSongsFromSpotifyPlaylist);
  router.post('/disconnectFromAllAccounts', disconnectSpotifyFromAllAccounts);
  router.get('/conflict-status/:username', getSpotifyConflictStatus);
  router.get('/conflict-user-id/:username', getSpotifyConflictUserId);
  router.post('/topArtists', getSpotifyTopArtists);
  router.get('/getSpotifyAccessToken/:username', getSpotifyAccessToken)
  router.post('/generateRandomTrackAndHint', generateRandomTrackAndHint)
  return router;
};

export default spotifyController;
