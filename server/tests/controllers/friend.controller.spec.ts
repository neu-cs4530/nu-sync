import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as friendService from '../../services/friend.service';

jest.mock('../../services/friend.service');

const mockFriendRequest = {
  _id: new mongoose.Types.ObjectId().toString(),
  requester: 'alice',
  recipient: 'bob',
  status: 'pending',
};

describe('Friend Request Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /friend/request', () => {
    it('should create a friend request', async () => {
      (friendService.createFriendRequest as jest.Mock).mockResolvedValue(mockFriendRequest);

      const res = await supertest(app)
        .post('/friend/request')
        .send({ requester: 'alice', recipient: 'bob' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockFriendRequest);
    });

    it('should return 400 if input is invalid (missing recipient)', async () => {
      const res = await supertest(app).post('/friend/request').send({ requester: 'alice' });
      expect(res.status).toBe(400);
    });

    it('should return 400 if body is missing', async () => {
      const res = await supertest(app).post('/friend/request');
      expect(res.status).toBe(400);
    });

    it('should return 400 if requester equals recipient', async () => {
      const res = await supertest(app)
        .post('/friend/request')
        .send({ requester: 'alice', recipient: 'alice' });
      expect(res.status).toBe(400);
    });

    it('should return 500 on service error', async () => {
      (friendService.createFriendRequest as jest.Mock).mockResolvedValue({ error: 'fail' });

      const res = await supertest(app)
        .post('/friend/request')
        .send({ requester: 'alice', recipient: 'bob' });

      expect(res.status).toBe(500);
    });
  });

  describe('PUT /friend/request/status', () => {
    it('should update request status', async () => {
      (friendService.updateFriendRequestStatus as jest.Mock).mockResolvedValue(mockFriendRequest);

      const res = await supertest(app)
        .put('/friend/request/status')
        .send({ requestId: 'abc123', status: 'accepted' });

      expect(res.status).toBe(200);
    });

    it('should return 400 for missing body', async () => {
      const res = await supertest(app).put('/friend/request/status').send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid status', async () => {
      const res = await supertest(app)
        .put('/friend/request/status')
        .send({ requestId: 'abc', status: 'invalid' });
      expect(res.status).toBe(400);
    });

    it('should return 500 if service errors', async () => {
      (friendService.updateFriendRequestStatus as jest.Mock).mockResolvedValue({ error: 'fail' });

      const res = await supertest(app)
        .put('/friend/request/status')
        .send({ requestId: 'abc123', status: 'accepted' });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /friend/requests/:username', () => {
    it('should return 400 if no username provided', async () => {
      const res = await supertest(app).get('/friend/requests/');
      expect(res.status).toBe(404);
    });

    it('should get friend requests for a user', async () => {
      (friendService.getFriendRequestsByUsername as jest.Mock).mockResolvedValue([
        mockFriendRequest,
      ]);
      const res = await supertest(app).get('/friend/requests/alice');
      expect(res.status).toBe(200);
    });

    it('should return 500 if service errors', async () => {
      (friendService.getFriendRequestsByUsername as jest.Mock).mockResolvedValue({ error: 'fail' });
      const res = await supertest(app).get('/friend/requests/alice');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /friend/requests/pending/:username', () => {
    it('should get pending requests', async () => {
      (friendService.getPendingFriendRequests as jest.Mock).mockResolvedValue([mockFriendRequest]);
      const res = await supertest(app).get('/friend/requests/pending/alice');
      expect(res.status).toBe(200);
    });
    

    it('should return 500 if service errors', async () => {
      (friendService.getPendingFriendRequests as jest.Mock).mockResolvedValue({ error: 'fail' });
      const res = await supertest(app).get('/friend/requests/pending/alice');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /friend/friends/:username', () => {
    it('should return friends', async () => {
      (friendService.getFriendsByUsername as jest.Mock).mockResolvedValue(['bob']);
      const res = await supertest(app).get('/friend/friends/alice');
      expect(res.status).toBe(200);
    });

    it('should return 400 if username missing', async () => {
      const res = await supertest(app).get('/friend/friends/');
      expect(res.status).toBe(404);
    });

    it('should return 500 on service error', async () => {
      (friendService.getFriendsByUsername as jest.Mock).mockResolvedValue({ error: 'fail' });
      const res = await supertest(app).get('/friend/friends/alice');
      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /friend/request/:requestId', () => {
    it('should delete a request', async () => {
      (friendService.deleteFriendRequest as jest.Mock).mockResolvedValue(mockFriendRequest);
      const id = new mongoose.Types.ObjectId();
      const res = await supertest(app).delete(`/friend/request/${id}`);
      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await supertest(app).delete('/friend/request/invalid-id');
      expect(res.status).toBe(400);
    });

    it('should return 400 if requestId is missing', async () => {
      const res = await supertest(app).delete('/friend/request/');
      expect(res.status).toBe(404);
    });

    it('should return 500 on service error', async () => {
      const id = new mongoose.Types.ObjectId();
      (friendService.deleteFriendRequest as jest.Mock).mockResolvedValue({ error: 'fail' });
      const res = await supertest(app).delete(`/friend/request/${id}`);
      expect(res.status).toBe(500);
    });
  });

  describe('GET /friend/mutual/:username1/:username2', () => {
    it('should return mutual friends', async () => {
      (friendService.getMutualFriends as jest.Mock).mockResolvedValue(['bob']);
      const res = await supertest(app).get('/friend/mutual/alice/bob');
      expect(res.status).toBe(200);
    });

    it('should return 400 if missing usernames', async () => {
      const res = await supertest(app).get('/friend/mutual/alice/');
      expect(res.status).toBe(404);
    });

    it('should return 500 if service errors', async () => {
      (friendService.getMutualFriends as jest.Mock).mockResolvedValue({ error: 'fail' });
      const res = await supertest(app).get('/friend/mutual/alice/bob');
      expect(res.status).toBe(500);
    });
  });
});
