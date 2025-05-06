import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/user.service';
import { SafeDatabaseUser, User } from '../../types/types';

const mockUser: User = {
  username: 'user1',
  password: 'password',
  dateJoined: new Date('2024-12-03'),
};

const mockSafeUser: SafeDatabaseUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'user1',
  dateJoined: new Date('2024-12-03'),
  friends: [],
  blockedUsers: [],
};

const mockUserJSONResponse = {
  _id: mockSafeUser._id.toString(),
  username: 'user1',
  dateJoined: new Date('2024-12-03').toISOString(),
  friends: [],
  blockedUsers: [],
};

const saveUserSpy = jest.spyOn(util, 'saveUser');
const loginUserSpy = jest.spyOn(util, 'loginUser');
const updatedUserSpy = jest.spyOn(util, 'updateUser');
const getUserByUsernameSpy = jest.spyOn(util, 'getUserByUsername');
const getUsersListSpy = jest.spyOn(util, 'getUsersList');
const deleteUserByUsernameSpy = jest.spyOn(util, 'deleteUserByUsername');

describe('Test userController', () => {
  describe('POST /signup', () => {
    it('should create a new user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
        biography: 'This is a test biography',
      };

      saveUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        biography: mockReqBody.biography,
      });

      const response = await supertest(app)
        .post('/user/signup')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockUserJSONResponse,
        biography: mockReqBody.biography,
      });
      expect(saveUserSpy).toHaveBeenCalledWith({
        ...mockReqBody,
        biography: mockReqBody.biography,
        dateJoined: expect.any(Date),
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app)
        .post('/user/signup')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: mockUser.password,
      };

      const response = await supertest(app)
        .post('/user/signup')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app)
        .post('/user/signup')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app)
        .post('/user/signup')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 for a database error while saving', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockResolvedValueOnce({ error: 'Error saving user' });

      const response = await supertest(app)
        .post('/user/signup')
        .send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /login', () => {
    it('should succesfully login for a user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce(mockSafeUser);
      updatedUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        onlineStatus: { status: 'online' },
      });

      const response = await supertest(app)
        .post('/user/login')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockUserJSONResponse,
        onlineStatus: { status: 'online' },
      });

      expect(loginUserSpy).toHaveBeenCalledWith(mockReqBody);
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        onlineStatus: { status: 'online' },
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app)
        .post('/user/login')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: mockUser.password,
      };

      const response = await supertest(app)
        .post('/user/login')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app)
        .post('/user/login')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app)
        .post('/user/login')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 for a database error while saving', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce({
        error: 'Error authenticating user',
      });

      const response = await supertest(app)
        .post('/user/login')
        .send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /resetPassword', () => {
    it('should succesfully return updated user object given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app)
        .patch('/user/resetPassword')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...mockUserJSONResponse });
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        password: 'newPassword',
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: 'newPassword',
      };

      const response = await supertest(app)
        .patch('/user/resetPassword')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: 'newPassword',
      };

      const response = await supertest(app)
        .patch('/user/resetPassword')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app)
        .patch('/user/resetPassword')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app)
        .patch('/user/resetPassword')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 for a database error while updating', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app)
        .patch('/user/resetPassword')
        .send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /getUser', () => {
    it('should return the user given correct arguments', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).get(
        `/user/getUser/${mockUser.username}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(getUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 500 if database error while searching username', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({
        error: 'Error finding user',
      });

      const response = await supertest(app).get(
        `/user/getUser/${mockUser.username}`,
      );

      expect(response.status).toBe(500);
    });

    it('should return 404 if username not provided', async () => {
      // Express automatically returns 404 for missing parameters when
      // defined as required in the route
      const response = await supertest(app).get('/user/getUser/');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /getUsers', () => {
    it('should return the users from the database', async () => {
      getUsersListSpy.mockResolvedValueOnce([mockSafeUser]);

      const response = await supertest(app).get(`/user/getUsers`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockUserJSONResponse]);
      expect(getUsersListSpy).toHaveBeenCalled();
    });

    it('should return 500 if database error while finding users', async () => {
      getUsersListSpy.mockResolvedValueOnce({ error: 'Error finding users' });

      const response = await supertest(app).get(`/user/getUsers`);

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /deleteUser', () => {
    it('should return the deleted user given correct arguments', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).delete(
        `/user/deleteUser/${mockUser.username}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(deleteUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 500 if database error while searching username', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce({
        error: 'Error deleting user',
      });

      const response = await supertest(app).delete(
        `/user/deleteUser/${mockUser.username}`,
      );

      expect(response.status).toBe(500);
    });

    it('should return 404 if username not provided', async () => {
      // Express automatically returns 404 for missing parameters when
      // defined as required in the route
      const response = await supertest(app).delete('/user/deleteUser/');
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /updateBiography', () => {
    it('should successfully update biography given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        biography: 'This is my new bio',
      };

      // Mock a successful updateUser call
      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app)
        .patch('/user/updateBiography')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      // Ensure updateUser is called with the correct args
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        biography: 'This is my new bio',
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        biography: 'some new biography',
      };

      const response = await supertest(app)
        .patch('/user/updateBiography')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        biography: 'a new bio',
      };

      const response = await supertest(app)
        .patch('/user/updateBiography')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing biography field', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app)
        .patch('/user/updateBiography')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 if updateUser returns an error', async () => {
      const mockReqBody = {
        username: mockUser.username,
        biography: 'Attempting update biography',
      };

      // Simulate a DB error
      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app)
        .patch('/user/updateBiography')
        .send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain(
        'Error when updating user biography: Error: Error updating user',
      );
    });
  });

  describe('PATCH /updatePrivacySettings', () => {
    const mockReqBody = {
      username: mockUser.username,
      privacySettings: {
        profileVisibility: 'private' as 'private' | 'public',
      },
    };

    it('should successfully update privacy settings with valid input', async () => {
      updatedUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        privacySettings: mockReqBody.privacySettings,
      });
      const response = await supertest(app)
        .patch('/user/updatePrivacySettings')
        .send(mockReqBody);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockUserJSONResponse,
        privacySettings: mockReqBody.privacySettings,
      });
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        privacySettings: mockReqBody.privacySettings,
      });
    });

    it('should return 400 if body is invalid', async () => {
      const response = await supertest(app)
        .patch('/user/updatePrivacySettings')
        .send({ username: '', privacySettings: {} });
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid privacy settings body');
    });

    it('should return 500 if updateUserPrivacySettings returns error', async () => {
      updatedUserSpy.mockResolvedValueOnce({
        error: 'Failed to update privacy settings',
      });
      const response = await supertest(app)
        .patch('/user/updatePrivacySettings')
        .send(mockReqBody);
      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating privacy settings');
    });
  });

  describe('PATCH /updateOnlineStatus', () => {
    const validStatus = {
      username: mockUser.username,
      onlineStatus: {
        status: 'busy',
        busySettings: { muteScope: 'friends-only' },
      },
    };

    it('should successfully update online status with valid input', async () => {
      updatedUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        onlineStatus: validStatus.onlineStatus,
      });
      const response = await supertest(app)
        .patch('/user/updateOnlineStatus')
        .send(validStatus);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockUserJSONResponse,
        onlineStatus: validStatus.onlineStatus,
      });
      expect(updatedUserSpy).toHaveBeenCalledWith(validStatus.username, {
        onlineStatus: validStatus.onlineStatus,
      });
    });

    it('should return 400 for invalid body', async () => {
      const response = await supertest(app)
        .patch('/user/updateOnlineStatus')
        .send({ username: '', onlineStatus: {} });
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid status update body');
    });

    it('should return 500 if updateUser returns error', async () => {
      updatedUserSpy.mockResolvedValueOnce({
        error: 'Failed to update status',
      });
      const response = await supertest(app)
        .patch('/user/updateOnlineStatus')
        .send(validStatus);
      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating online status');
    });
  });

  describe('POST /block', () => {
    const mockBlockUser = {
      username: 'blocker',
      userToBlock: 'blocked',
    };

    const mockUpdatedUser = {
      ...mockSafeUser,
      blockedUsers: ['blocked'],
    };

    const mockUpdatedUserJSONResponse = {
      ...mockUserJSONResponse,
      blockedUsers: ['blocked'],
    };

    const blockUserSpy = jest.spyOn(util, 'blockUser');

    it('should successfully block a user when given valid input', async () => {
      blockUserSpy.mockResolvedValueOnce(mockUpdatedUser);

      const response = await supertest(app)
        .post('/user/block')
        .send(mockBlockUser);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedUserJSONResponse);
      expect(blockUserSpy).toHaveBeenCalledWith(
        mockBlockUser.username,
        mockBlockUser.userToBlock,
      );
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        userToBlock: 'blocked',
      };

      const response = await supertest(app)
        .post('/user/block')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid block request');
    });

    it('should return 400 for request with empty userToBlock', async () => {
      const mockReqBody = {
        username: 'blocker',
        userToBlock: '',
      };

      const response = await supertest(app)
        .post('/user/block')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid block request');
    });

    it('should return 400 if trying to block yourself', async () => {
      const mockReqBody = {
        username: 'sameuser',
        userToBlock: 'sameuser',
      };

      const response = await supertest(app)
        .post('/user/block')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid block request');
    });

    it('should return 500 if blockUser returns an error', async () => {
      blockUserSpy.mockResolvedValueOnce({ error: 'Error blocking user' });

      const response = await supertest(app)
        .post('/user/block')
        .send(mockBlockUser);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error blocking user');
    });
  });

  describe('POST /unblock', () => {
    const mockUnblockUser = {
      username: 'blocker',
      userToBlock: 'blocked', // The field is still called userToBlock in the request
    };

    const mockUpdatedUser = {
      ...mockSafeUser,
      blockedUsers: [], // Empty after unblocking
    };

    const mockUpdatedUserJSONResponse = {
      ...mockUserJSONResponse,
      blockedUsers: [], // Empty after unblocking
    };

    const unblockUserSpy = jest.spyOn(util, 'unblockUser');

    it('should successfully unblock a user when given valid input', async () => {
      unblockUserSpy.mockResolvedValueOnce(mockUpdatedUser);

      const response = await supertest(app)
        .post('/user/unblock')
        .send(mockUnblockUser);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedUserJSONResponse);
      expect(unblockUserSpy).toHaveBeenCalledWith(
        mockUnblockUser.username,
        mockUnblockUser.userToBlock,
      );
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        userToBlock: 'blocked',
      };

      const response = await supertest(app)
        .post('/user/unblock')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid unblock request');
    });

    it('should return 400 for request with empty userToBlock', async () => {
      const mockReqBody = {
        username: 'blocker',
        userToBlock: '',
      };

      const response = await supertest(app)
        .post('/user/unblock')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid unblock request');
    });

    it('should return 400 if trying to unblock yourself', async () => {
      const mockReqBody = {
        username: 'sameuser',
        userToBlock: 'sameuser',
      };

      const response = await supertest(app)
        .post('/user/unblock')
        .send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid unblock request');
    });

    it('should return 500 if unblockUser returns an error', async () => {
      unblockUserSpy.mockResolvedValueOnce({ error: 'Error unblocking user' });

      const response = await supertest(app)
        .post('/user/unblock')
        .send(mockUnblockUser);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error unblocking user');
    });
  });
});
