import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/user.service';
import { SafeDatabaseUser } from '../../types/types';

describe('Quiet Controller', () => {
  const mockUser: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'quietUser',
    dateJoined: new Date('2024-01-01'),
    friends: [],
  };

  const userJson = {
    ...mockUser,
    _id: mockUser._id.toString(),
    dateJoined: mockUser.dateJoined.toISOString(),
  };

  const setSpy = jest.spyOn(util, 'setUserToQuietHours');
  const restoreSpy = jest.spyOn(util, 'restoreUserFromQuietHours');
  const updateSpy = jest.spyOn(util, 'updateUserQuietHours');

  describe('POST /quiet/applyQuietHours/:username', () => {
    it('should apply quiet hours successfully', async () => {
      setSpy.mockResolvedValueOnce(mockUser);

      const res = await supertest(app).post('/quiet/applyQuietHours/quietUser');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Quiet hours applied',
        user: userJson,
      });
    });

    it('should return 400 on service error', async () => {
      setSpy.mockResolvedValueOnce({ error: 'User not found' });

      const res = await supertest(app).post('/quiet/applyQuietHours/quietUser');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'User not found' });
    });

    it('should return 500 on internal error', async () => {
      setSpy.mockRejectedValueOnce(new Error('DB issue'));

      const res = await supertest(app).post('/quiet/applyQuietHours/quietUser');

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Failed to apply quiet hours:');
    });
  });

  describe('POST /quiet/restoreQuietHours/:username', () => {
    it('should restore quiet hours successfully', async () => {
      restoreSpy.mockResolvedValueOnce(mockUser);

      const res = await supertest(app).post('/quiet/restoreQuietHours/quietUser');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Quiet hours restored',
        user: userJson,
      });
    });

    it('should return 400 on service error', async () => {
      restoreSpy.mockResolvedValueOnce({ error: 'Invalid user' });

      const res = await supertest(app).post('/quiet/restoreQuietHours/quietUser');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid user' });
    });

    it('should return 500 on internal error', async () => {
      restoreSpy.mockRejectedValueOnce(new Error('DB error'));

      const res = await supertest(app).post('/quiet/restoreQuietHours/quietUser');

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Failed to restore quiet hours:');
    });
  });

  describe('PATCH /quiet/updateQuietHours', () => {
    const validBody = {
      username: 'quietUser',
      quietHours: { start: '22:00', end: '06:00' },
    };

    it('should update quiet hours successfully', async () => {
      updateSpy.mockResolvedValueOnce(mockUser);

      const res = await supertest(app).patch('/quiet/updateQuietHours').send(validBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Quiet hours updated',
        user: userJson,
      });
    });

    it('should return 400 if username is invalid', async () => {
      const res = await supertest(app)
        .patch('/quiet/updateQuietHours')
        .send({ quietHours: validBody.quietHours });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid username' });
    });

    it('should return 400 on service error', async () => {
      updateSpy.mockResolvedValueOnce({ error: 'Bad hours' });

      const res = await supertest(app).patch('/quiet/updateQuietHours').send(validBody);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Bad hours' });
    });

    it('should return 500 on internal error', async () => {
      updateSpy.mockRejectedValueOnce(new Error('Unexpected fail'));

      const res = await supertest(app).patch('/quiet/updateQuietHours').send(validBody);

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Failed to update quiet hours:');
    });
  });
});
