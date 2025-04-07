import mongoose from 'mongoose';
import FriendRequestModel from '../../models/friend-request.model';
import UserModel from '../../models/users.model';
import * as friendService from '../../services/friend.service';
import { DatabaseFriendRequest, FriendUser } from '../../types/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

describe('Friend Service', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  const mockUserA: FriendUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'alice',
  };

  const mockUserB: FriendUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'bob',
  };

  const mockFriendRequest: DatabaseFriendRequest = {
    _id: new mongoose.Types.ObjectId(),
    requester: mockUserA,
    recipient: mockUserB,
    status: 'pending',
    requestedAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createFriendRequest', () => {
    it('should return error if requester or recipient is not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');
      const result = await friendService.createFriendRequest('alice', 'bob');
      expect('error' in result).toBe(true);
    });

    it('should return error if user tries to friend themselves', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      const result = await friendService.createFriendRequest('alice', 'alice');
      expect('error' in result).toBe(true);
    });

    it('should return error if a pending or accepted request already exists', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      mockingoose(UserModel).toReturn(mockUserB, 'findOne');
      mockingoose(FriendRequestModel).toReturn(mockFriendRequest, 'findOne');
      const result = await friendService.createFriendRequest('alice', 'bob');
      expect('error' in result).toBe(true);
    });

    it('should update and return a rejected request', async () => {
      const rejectedRequest = { ...mockFriendRequest, status: 'rejected' };
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      mockingoose(UserModel).toReturn(mockUserB, 'findOne');
      mockingoose(FriendRequestModel).toReturn(rejectedRequest, 'findOne');
      mockingoose(FriendRequestModel).toReturn(mockFriendRequest, 'findOneAndUpdate');
      const result = await friendService.createFriendRequest('alice', 'bob');
      expect('error' in result).toBe(false);
    });

    it('should catch error during creation', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      jest.spyOn(UserModel, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      const result = await friendService.createFriendRequest('alice', 'bob');
      expect('error' in result).toBe(true);
    });

    it('should throw error if updating a rejected request fails', async () => {
      const rejectedRequest = { ...mockFriendRequest, status: 'rejected' };
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      mockingoose(UserModel).toReturn(mockUserB, 'findOne');
      mockingoose(FriendRequestModel).toReturn(rejectedRequest, 'findOne');
      mockingoose(FriendRequestModel).toReturn(null, 'findOneAndUpdate');
      const result = await friendService.createFriendRequest('alice', 'bob');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toMatch('Failed to update');
      } else {
        throw new Error('Expected an error result but got a valid response');
      }
    });
    it('should return error if populated friend request is not found after save', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      mockingoose(UserModel).toReturn(mockUserB, 'findOne');

      mockingoose(FriendRequestModel).toReturn(null, 'findOne');
      mockingoose(FriendRequestModel).toReturn(mockFriendRequest, 'save');
      mockingoose(FriendRequestModel).toReturn(null, 'findOne');

      const result = await friendService.createFriendRequest('alice', 'bob');

      expect('error' in result).toBe(true);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toMatch(
          'Error occurred when creating friend request: Error: Failed to create friend request',
        );
      } else {
        throw new Error('Expected an error result but got a valid response');
      }
    });

    it('should create and return a fully populated friend request (full path)', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      mockingoose(UserModel).toReturn(mockUserB, 'findOne');
      mockingoose(FriendRequestModel).toReturn(null, 'findOne');
      const savedRequest = {
        _id: new mongoose.Types.ObjectId(),
        requester: mockUserA._id,
        recipient: mockUserB._id,
        status: 'pending' as const,
        requestedAt: new Date(),
        updatedAt: new Date(),
      };
      mockingoose(FriendRequestModel).toReturn(savedRequest, 'save');
      const populatedRequest: DatabaseFriendRequest = {
        ...savedRequest,
        requester: { _id: mockUserA._id, username: mockUserA.username },
        recipient: { _id: mockUserB._id, username: mockUserB.username },
      };
      mockingoose(FriendRequestModel).toReturn(populatedRequest, 'findById');
      const result = await friendService.createFriendRequest('alice', 'bob');
      if (!('error' in result)) {
        expect(result.status).toBe('pending');
        expect(result.requester.username).toBe('alice');
        expect(result.recipient.username).toBe('bob');
      }
    });
  });

  describe('updateFriendRequestStatus', () => {
    it('should return updated request', async () => {
      mockingoose(FriendRequestModel).toReturn(mockFriendRequest, 'findOneAndUpdate');
      const result = await friendService.updateFriendRequestStatus(
        mockFriendRequest._id.toString(),
        'accepted',
      );
      expect('error' in result).toBe(false);
    });

    it('should return error if request not found', async () => {
      mockingoose(FriendRequestModel).toReturn(null, 'findOneAndUpdate');
      const result = await friendService.updateFriendRequestStatus(
        mockFriendRequest._id.toString(),
        'accepted',
      );
      expect('error' in result).toBe(true);
    });

    it('should catch and return error if findByIdAndUpdate throws', async () => {
      jest.spyOn(FriendRequestModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
        throw new Error('DB failure');
      });
      const result = await friendService.updateFriendRequestStatus(
        mockFriendRequest._id.toString(),
        'accepted',
      );
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toMatch('Error occurred when updating friend request status');
      }
    });
  });

  describe('getFriendRequestsByUsername', () => {
    it('should return error if user not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');
      const result = await friendService.getFriendRequestsByUsername('alice');
      expect('error' in result).toBe(true);
    });

    it('should return all friend requests', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      mockingoose(FriendRequestModel).toReturn([mockFriendRequest], 'find');
      const result = await friendService.getFriendRequestsByUsername('alice');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should catch and return error if database throws during retrieval', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      jest.spyOn(FriendRequestModel, 'find').mockImplementationOnce(() => {
        throw new Error('Database error in FriendRequestModel.find');
      });
      const result = await friendService.getFriendRequestsByUsername('alice');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toMatch("Error occurred when getting friend requests");
      }
    });
  });

  describe('getPendingFriendRequests', () => {
    it('should return pending friend requests', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      mockingoose(FriendRequestModel).toReturn([mockFriendRequest], 'find');
      const result = await friendService.getPendingFriendRequests('alice');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return error if user not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');
      const result = await friendService.getPendingFriendRequests('alice');
      expect('error' in result).toBe(true);
    });

    it('should catch and return error if database throws during retrieval', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      jest.spyOn(FriendRequestModel, 'find').mockImplementationOnce(() => {
        throw new Error('DB error in pending requests');
      });
      const result = await friendService.getPendingFriendRequests('alice');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toMatch("Error occurred when getting pending requests");
      }
    });
  });

  describe('getFriendsByUsername', () => {
    it('should return list of friends', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      mockingoose(FriendRequestModel).toReturn([mockFriendRequest], 'find');
      const result = await friendService.getFriendsByUsername('alice');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return error if user not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');
      const result = await friendService.getFriendsByUsername('alice');
      expect('error' in result).toBe(true);
    });

    it('should catch and return error if database throws during accepted request retrieval', async () => {
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      jest.spyOn(FriendRequestModel, 'find').mockImplementationOnce(() => {
        throw new Error('DB error in accepted requests');
      });
      const result = await friendService.getFriendsByUsername('alice');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toMatch("Error occurred when getting friends");
      }
    });
  });

  describe('deleteFriendRequest', () => {
    it('should delete and return the request', async () => {
      mockingoose(FriendRequestModel).toReturn(mockFriendRequest, 'findOne');
      mockingoose(FriendRequestModel).toReturn(mockFriendRequest, 'findOneAndDelete');
      const result = await friendService.deleteFriendRequest(mockFriendRequest._id.toString());
      expect('error' in result).toBe(false);
    });

    it('should return error if not found', async () => {
      mockingoose(FriendRequestModel).toReturn(null, 'findById');
      const result = await friendService.deleteFriendRequest(mockFriendRequest._id.toString());
      expect('error' in result).toBe(true);
    });

    it('should catch and return error if database throws during deletion', async () => {
      jest.spyOn(FriendRequestModel, 'findById').mockImplementationOnce(() => {
        throw new Error('DB error during findById');
      });
      const result = await friendService.deleteFriendRequest(mockFriendRequest._id.toString());
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toMatch(/Error occurred when deleting friend request/);
      }
    });
  });

  describe('getMutualFriends', () => {
    it('should return mutual friends', async () => {
      const otherUser: FriendUser = { _id: new mongoose.Types.ObjectId(), username: 'carol' };
      mockingoose(UserModel).toReturn(mockUserA, 'findOne');
      mockingoose(UserModel).toReturn(otherUser, 'findOne');
      mockingoose(FriendRequestModel).toReturn([mockFriendRequest], 'find');
      mockingoose(UserModel).toReturn([mockUserB], 'find');
      const result = await friendService.getMutualFriends('alice', 'carol');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return error if either user not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');
      const result = await friendService.getMutualFriends('alice', 'bob');
      expect('error' in result).toBe(true);
    });
  });

  it('should catch and return error if database throws during mutual friend lookup', async () => {
    const otherUser: FriendUser = { _id: new mongoose.Types.ObjectId(), username: 'carol' };
    mockingoose(UserModel).toReturn(mockUserA, 'findOne');
    mockingoose(UserModel).toReturn(otherUser, 'findOne');
    mockingoose(FriendRequestModel).toReturn([mockFriendRequest], 'find');
    jest.spyOn(UserModel, 'find').mockImplementationOnce(() => {
      throw new Error('Simulated DB failure in mutual friend lookup');
    });
    const result = await friendService.getMutualFriends('alice', 'carol');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toMatch("Error occurred when getting mutual friends");
    }
  });
});
