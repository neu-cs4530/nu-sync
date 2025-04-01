import supertest from 'supertest';
import mongoose from 'mongoose';
import axios from 'axios';
import { app } from '../../app';
import UserModel from '../../models/users.model';
import { DatabaseUser } from '../../types/types';


jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../models/users.model');
const MockedUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('Spotify Controller Tests', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /spotify/auth/spotify', () => {
    it('should redirect to Spotify login', async () => {
      const response = await supertest(app).get('/spotify/auth/spotify?username=testuser');
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('https://accounts.spotify.com/authorize');
    });
  });

  describe('GET /spotify/auth/callback', () => {

    it('should handle Error instance while fetching Spotify profile', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'access', refresh_token: 'refresh', expires_in: 3600 },
      });

      mockedAxios.get.mockRejectedValueOnce(new Error('profile failed'));

      const response = await supertest(app).get(
        '/spotify/auth/callback?code=abc&state=TEST:testuser',
      );
      expect(response.status).toBe(500);
      expect(response.text).toBe('Error when fetching spotify user profile: profile failed');
    });
    it('should redirect to frontend after successful auth', async () => {
      const code = 'testcode';
      const state = 'TEST:testuser';

      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'access', refresh_token: 'refresh', expires_in: 3600 },
      });

      mockedAxios.get.mockResolvedValueOnce({ data: { id: 'spotify_user_id' } });
      MockedUserModel.findOneAndUpdate.mockResolvedValueOnce({
        username: 'testuser',
      } as DatabaseUser);

      const response = await supertest(app).get(
        `/spotify/auth/callback?code=${code}&state=${state}`,
      );

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/user/testuser');
    });

    it('should handle missing state in callback by redirecting with error', async () => {
      const response = await supertest(app).get('/spotify/auth/callback?code=testcode');
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('state_mismatch');
    });

    it('should return 404 if user not found', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'access', refresh_token: 'refresh', expires_in: 3600 },
      });
      mockedAxios.get.mockResolvedValueOnce({ data: { id: 'spotify_user_id' } });
      MockedUserModel.findOneAndUpdate.mockResolvedValueOnce(null);

      const response = await supertest(app).get(
        '/spotify/auth/callback?code=test&state=TEST:testuser',
      );
      expect(response.status).toBe(404);
    });

    it('should handle unknown error while fetching Spotify profile', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'access', refresh_token: 'refresh', expires_in: 3600 },
      });
      mockedAxios.get.mockRejectedValueOnce('unexpected');

      const response = await supertest(app).get(
        '/spotify/auth/callback?code=code&state=TEST:testuser',
      );
      expect(response.status).toBe(500);
      expect(response.text).toBe('Error when fetching spotify user profile');
    });

    it('should handle access token fetch error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Token error'));
      const response = await supertest(app).get(
        '/spotify/auth/callback?code=test&state=TEST:testuser',
      );
      expect(response.status).toBe(500);
    });

    it('should handle unknown error when fetching access token', async () => {
      mockedAxios.post.mockRejectedValueOnce('bad token');
      const response = await supertest(app).get(
        '/spotify/auth/callback?code=x&state=TEST:testuser',
      );
      expect(response.status).toBe(500);
      expect(response.text).toBe('Invalid spotify access token');
    });
  });

  describe('PATCH /spotify/disconnect', () => {
    it('should successfully disconnect Spotify', async () => {
      MockedUserModel.findOneAndUpdate.mockResolvedValueOnce({} as DatabaseUser);

      const response = await supertest(app)
        .patch('/spotify/disconnect')
        .send({ username: 'testuser' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Spotify disconnected successfully');
    });

    it('should return 500 if DB update fails with non-Error object', async () => {
      MockedUserModel.findOneAndUpdate.mockRejectedValueOnce('fail');
      const response = await supertest(app)
        .patch('/spotify/disconnect')
        .send({ username: 'testuser' });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(
        'Unable to update user data in backend while disconnecting from Spotify',
      );
    });

    it('should return 500 if DB update fails', async () => {
      MockedUserModel.findOneAndUpdate.mockRejectedValueOnce(new Error('DB error'));
      const response = await supertest(app)
        .patch('/spotify/disconnect')
        .send({ username: 'testuser' });
      expect(response.status).toBe(500);
    });
  });

  describe('GET /spotify/getPlaylistTracks', () => {
    it('should return 400 if playlistId or access_token is missing', async () => {
      const res1 = await supertest(app).get('/spotify/getPlaylistTracks?access_token=abc');
      expect(res1.status).toBe(400);
      expect(res1.body.error).toBe('Missing playlistId or access_token');

      const res2 = await supertest(app).get('/spotify/getPlaylistTracks?playlistId=123');
      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('Missing playlistId or access_token');
    });

    it('should return 200 with track items if valid params are given', async () => {
      const mockTracks = [{ name: 'Track 1' }, { name: 'Track 2' }];
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          items: mockTracks,
        },
      });

      const response = await supertest(app).get(
        '/spotify/getPlaylistTracks?playlistId=test123&access_token=fake-token',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tracks: mockTracks });
    });

    it('should return 500 if Spotify API fails when getting playlist tracks', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Spotify failure'));

      const response = await supertest(app).get(
        '/spotify/getPlaylistTracks?playlistId=abc&access_token=xyz',
      );

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Failed to fetch playlist tracks');
    });
  });

  describe('GET /spotify/current-track', () => {
    it('should return 400 if username is not provided in currently-playing route', async () => {
      const response = await supertest(app).get('/spotify/current-track');
      expect(response.status).toBe(400);
    });

    it('should return 404 if user not found in currently-playing route', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce(null);

      const response = await supertest(app).get('/spotify/current-track?username=testuser');
      expect(response.status).toBe(404);
    });

    it('should handle unknown error when fetching user from DB for current-track', async () => {
      MockedUserModel.findOne.mockRejectedValueOnce('Unknown failure');
      const response = await supertest(app).get('/spotify/current-track?username=testuser');
      expect(response.status).toBe(500);
      expect(response.body.message).toContain(
        'Unknown error occurred while checking current track.',
      );
    });

    it('should handle Error instance when DB fetch fails in current-track route', async () => {
      MockedUserModel.findOne.mockRejectedValueOnce(new Error('DB down'));

      const response = await supertest(app).get('/spotify/current-track?username=testuser');
      expect(response.status).toBe(500);
      expect(response.body.message).toContain('DB down');
    });

    it('should return isPlaying=false if Spotify responds with 204 or empty data', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'token',
      } as DatabaseUser);

      mockedAxios.get.mockResolvedValueOnce({ status: 204 });

      const response = await supertest(app).get('/spotify/current-track?username=testuser');
      expect(response.status).toBe(200);
      expect(response.body.isPlaying).toBe(false);
    });

    it('should return 200 with currently playing track data', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'valid-token',
      } as DatabaseUser);

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          is_playing: true,
          item: { name: 'Track Name' },
          progress_ms: 12345,
          timestamp: 1710000000000,
        },
      });

      const response = await supertest(app).get('/spotify/current-track?username=testuser');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        isPlaying: true,
        track: { name: 'Track Name' },
        progress_ms: 12345,
        timestamp: 1710000000000,
      });
    });

    it('should return 500 with error message if Spotify track fetch throws Error', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'token',
      } as DatabaseUser);

      mockedAxios.get.mockRejectedValueOnce(new Error('Spotify failed'));

      const response = await supertest(app).get('/spotify/current-track?username=testuser');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to fetch currently playing track: Spotify failed');
    });

    it('should return 500 with generic error if Spotify track fetch fails non-Error', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'token',
      } as DatabaseUser);

      mockedAxios.get.mockRejectedValueOnce('random string');

      const response = await supertest(app).get('/spotify/current-track?username=testuser');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe(
        'Unknown error occurred while fetching currently playing track.',
      );
    });
  });

  describe('POST /spotify/auth/refresh', () => {
    it('should refresh the Spotify token successfully', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyRefreshToken: 'refresh',
      } as DatabaseUser);
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'newAccess', refresh_token: 'newRefresh' },
      });
      MockedUserModel.findOneAndUpdate.mockResolvedValueOnce({} as DatabaseUser);

      const response = await supertest(app)
        .post('/spotify/auth/refresh')
        .send({ username: 'testuser' });
      expect(response.status).toBe(200);
      expect(response.body.access_token).toBe('newAccess');
    });

    it('should return 400 for missing username', async () => {
      const response = await supertest(app).post('/spotify/auth/refresh').send({});
      expect(response.status).toBe(400);
    });

    it('should return 500 if refresh token throws non-Error', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyRefreshToken: 'refresh',
      } as DatabaseUser);

      mockedAxios.post.mockRejectedValueOnce('bad thing');

      const response = await supertest(app)
        .post('/spotify/auth/refresh')
        .send({ username: 'testuser' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Unknown error refreshing Spotify token');
    });

    it('should return 404 if user not found', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce(null);
      const response = await supertest(app)
        .post('/spotify/auth/refresh')
        .send({ username: 'testuser' });
      expect(response.status).toBe(404);
    });

    it('should return 400 if no refresh token is stored', async () => {
      const mockUser: DatabaseUser = {
        _id: new mongoose.Types.ObjectId(),
        username: 'testuser',
        password: 'pass',
        dateJoined: new Date(),
        friends: [],
        spotifyRefreshToken: undefined,
      };
      MockedUserModel.findOne.mockResolvedValueOnce(mockUser);

      const response = await supertest(app)
        .post('/spotify/auth/refresh')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
    });

    it('should return 500 on Spotify error', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyRefreshToken: 'refresh',
      } as DatabaseUser);
      mockedAxios.post.mockRejectedValueOnce(new Error('Spotify error'));
      const response = await supertest(app)
        .post('/spotify/auth/refresh')
        .send({ username: 'testuser' });
      expect(response.status).toBe(500);
    });
  });

  describe('POST /spotify/getPlaylists', () => {
    it('should fetch playlists', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'token',
      } as DatabaseUser);
      mockedAxios.get.mockResolvedValueOnce({ data: { items: ['playlist1', 'playlist2'] } });

      const response = await supertest(app)
        .post('/spotify/getPlaylists')
        .send({ username: 'testuser' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(['playlist1', 'playlist2']);
    });

    it('should refresh and retry if token expired (401)', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'old_token',
        spotifyRefreshToken: 'refresh',
      } as DatabaseUser);

      mockedAxios.get.mockRejectedValueOnce({ response: { status: 401 } });
      mockedAxios.post.mockResolvedValueOnce({ data: { access_token: 'new_token' } });
      mockedAxios.get.mockResolvedValueOnce({ data: { items: ['playlist1'] } });

      const response = await supertest(app)
        .post('/spotify/getPlaylists')
        .send({ username: 'testuser' });
      expect(response.status).toBe(200);
    });

    it('should return 404 if user not found', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce(null);
      const response = await supertest(app)
        .post('/spotify/getPlaylists')
        .send({ username: 'testuser' });
      expect(response.status).toBe(404);
    });

    it('should return 429 if rate limited', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'token',
      } as DatabaseUser);
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 429,
          headers: { 'retry-after': '10' },
          data: 'rate-limit-error',
        },
      });

      const response = await supertest(app)
        .post('/spotify/getPlaylists')
        .send({ username: 'testuser' });
      expect(response.status).toBe(429);
    });

    it('should return 500 on other errors', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'token',
      } as DatabaseUser);
      mockedAxios.get.mockRejectedValueOnce(new Error('Unknown error'));
      const response = await supertest(app)
        .post('/spotify/getPlaylists')
        .send({ username: 'testuser' });
      expect(response.status).toBe(500);
    });
  });

  describe('GET /spotify/isConnected', () => {
    it('should return connected and playing status', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'token',
        spotifyRefreshToken: 'refresh',
        spotifyId: 'id',
        toObject: () => ({
          spotifyAccessToken: 'token',
          spotifyRefreshToken: 'refresh',
          spotifyId: 'id',
        }),
      } as unknown as DatabaseUser);
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { is_playing: true } });
      const response = await supertest(app).get('/spotify/isConnected?username=testuser');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ isConnected: true, currentlyPlaying: true });
    });

    it('should return 400 if username is missing in query for checkSpotifyConnection', async () => {
      const response = await supertest(app).get('/spotify/isConnected');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username is required in query params');
    });

    it('should return 404 if user not found in checkSpotifyConnection', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce(null);

      const response = await supertest(app).get('/spotify/isConnected?username=testuser');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should return isConnected true and currentlyPlaying false if fetch currently playing fails', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        spotifyAccessToken: 'valid-token',
        spotifyRefreshToken: 'valid-refresh',
        spotifyId: 'spotify-id',
        toObject: () => ({
          spotifyAccessToken: 'valid-token',
          spotifyRefreshToken: 'valid-refresh',
          spotifyId: 'spotify-id',
        }),
      });

      mockedAxios.get.mockRejectedValueOnce(new Error('fail'));

      const response = await supertest(app).get('/spotify/isConnected?username=testuser');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ isConnected: true, currentlyPlaying: false });
    });

    it('should return 500 if user lookup throws unexpected error', async () => {
      MockedUserModel.findOne.mockRejectedValueOnce(new Error('DB failed'));

      const response = await supertest(app).get('/spotify/isConnected?username=testuser');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to check Spotify connection');
    });



    it('should return not connected if no tokens', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        toObject: () => ({}),
      } as unknown as DatabaseUser);
      const response = await supertest(app).get('/spotify/isConnected?username=testuser');
      expect(response.body.isConnected).toBe(false);
    });
  });
});
