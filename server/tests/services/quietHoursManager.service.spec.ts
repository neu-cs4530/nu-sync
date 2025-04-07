import moment from 'moment';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { Server } from 'socket.io';

import UserModel from '../../models/users.model';
import startQuietHoursCronJob from '../../services/quietHoursManager.service';
import * as userService from '../../services/user.service';
import { SafeDatabaseUser } from '../../types/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

// Capture cron callback manually
let scheduledCallback: () => Promise<void>;
jest.mock('node-cron', () => ({
  schedule: jest.fn((_, cb) => {
    scheduledCallback = cb;
  }),
}));

const mockEmit = jest.fn();
const fakeSocket = {
  emit: mockEmit,
} as unknown as Server;

describe('Quiet Hours Cron Job', () => {
  const baseUser: SafeDatabaseUser = {
    _id: new ObjectId(),
    username: 'testuser',
    dateJoined: new Date(),
    friends: [],
    onlineStatus: { status: 'online' },
    quietHours: {
      start: '01:00',
      end: '23:00',
    },
    oldStatus: { status: 'online' },
  };

  beforeEach(() => {
    mockingoose.resetAll();
    jest.clearAllMocks();
    startQuietHoursCronJob(fakeSocket);
  });

  describe('startQuietHoursCronJob', () => {
    it('should set user to quiet hours if within range', async () => {
      mockingoose(UserModel).toReturn([baseUser], 'find');
      jest.spyOn(moment, 'utc').mockReturnValue(moment.utc('02:00', 'HH:mm'));
      jest.spyOn(userService, 'setUserToQuietHours').mockResolvedValue(baseUser);

      await scheduledCallback();

      expect(userService.setUserToQuietHours).toHaveBeenCalledWith(baseUser.username);
      expect(mockEmit).toHaveBeenCalledWith('userUpdate', { user: baseUser, type: 'updated' });
    });

    it('should restore user from quiet hours if outside range and currently busy', async () => {
      const busyUser: SafeDatabaseUser = {
        ...baseUser,
        onlineStatus: { status: 'busy' },
        quietHours: { start: '01:00', end: '02:00' },
      };

      mockingoose(UserModel).toReturn([busyUser], 'find');
      jest.spyOn(moment, 'utc').mockReturnValue(moment.utc('03:00', 'HH:mm'));
      jest.spyOn(userService, 'restoreUserFromQuietHours').mockResolvedValue(busyUser);

      await scheduledCallback();

      expect(userService.restoreUserFromQuietHours).toHaveBeenCalledWith(busyUser.username);
      expect(mockEmit).toHaveBeenCalledWith('userUpdate', { user: busyUser, type: 'updated' });
    });

    it('should skip users with invalid start time format', async () => {
      const invalidUser: SafeDatabaseUser = {
        ...baseUser,
        quietHours: { start: 'invalid', end: '23:00' },
      };

      mockingoose(UserModel).toReturn([invalidUser], 'find');

      await scheduledCallback();

      expect(userService.setUserToQuietHours).not.toHaveBeenCalled();
      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should skip users with no quiet hours defined', async () => {
      const noQuietUser: SafeDatabaseUser = {
        ...baseUser,
        quietHours: undefined,
      };

      mockingoose(UserModel).toReturn([noQuietUser], 'find');

      await scheduledCallback();

      expect(userService.setUserToQuietHours).not.toHaveBeenCalled();
      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should not emit if service returns error', async () => {
      mockingoose(UserModel).toReturn([baseUser], 'find');
      jest.spyOn(moment, 'utc').mockReturnValue(moment.utc('02:00', 'HH:mm'));
      jest.spyOn(userService, 'setUserToQuietHours').mockResolvedValue({ error: 'failure' });

      await scheduledCallback();

      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should not crash if database query fails', async () => {
      mockingoose(UserModel).toReturn(new Error('DB error'), 'find');

      await expect(scheduledCallback()).resolves.not.toThrow();
      expect(mockEmit).not.toHaveBeenCalled();
    });
  });
});
