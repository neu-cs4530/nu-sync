import mongoose from 'mongoose';
import UserModel from '../../models/users.model';
import {
  deleteUserByUsername,
  getUserByUsername,
  getUsersList,
  loginUser,
  restoreUserFromQuietHours,
  saveUser,
  setUserToQuietHours,
  updateUser,
  updateUserPrivacySettings,
  updateUserQuietHours,
} from '../../services/user.service';
import { PrivacySettings, SafeDatabaseUser, User, UserCredentials } from '../../types/types';
import { user, safeUser } from '../mockData.models';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

describe('User model', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  describe('saveUser', () => {
    beforeEach(() => {
      mockingoose.resetAll();
    });

    it('should return the saved user', async () => {
      mockingoose(UserModel).toReturn(user, 'create');

      const savedUser = (await saveUser(user)) as SafeDatabaseUser;

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toEqual(user.username);
      expect(savedUser.dateJoined).toEqual(user.dateJoined);
    });

    it('should throw an error if error when saving to database', async () => {
      jest
        .spyOn(UserModel, 'create')
        .mockRejectedValueOnce(() => new Error('Error saving document'));

      const saveError = await saveUser(user);

      expect('error' in saveError).toBe(true);
    });
  });
});

describe('getUserByUsername', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the matching user', async () => {
    mockingoose(UserModel).toReturn(safeUser, 'findOne');

    const retrievedUser = (await getUserByUsername(user.username)) as SafeDatabaseUser;

    expect(retrievedUser.username).toEqual(user.username);
    expect(retrievedUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should throw an error if the user is not found', async () => {
    mockingoose(UserModel).toReturn(null, 'findOne');

    const getUserError = await getUserByUsername(user.username);

    expect('error' in getUserError).toBe(true);
  });

  it('should throw an error if there is an error while searching the database', async () => {
    mockingoose(UserModel).toReturn(new Error('Error finding document'), 'findOne');

    const getUserError = await getUserByUsername(user.username);

    expect('error' in getUserError).toBe(true);
  });
});

describe('getUsersList', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the users', async () => {
    mockingoose(UserModel).toReturn([safeUser], 'find');

    const retrievedUsers = (await getUsersList()) as SafeDatabaseUser[];

    expect(retrievedUsers[0].username).toEqual(safeUser.username);
    expect(retrievedUsers[0].dateJoined).toEqual(safeUser.dateJoined);
  });

  it('should throw an error if the users cannot be found', async () => {
    mockingoose(UserModel).toReturn(null, 'find');

    const getUsersError = await getUsersList();

    expect('error' in getUsersError).toBe(true);
  });

  it('should throw an error if there is an error while searching the database', async () => {
    mockingoose(UserModel).toReturn(new Error('Error finding document'), 'find');

    const getUsersError = await getUsersList();

    expect('error' in getUsersError).toBe(true);
  });
});

describe('loginUser', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the user if authentication succeeds', async () => {
    mockingoose(UserModel).toReturn(safeUser, 'findOne');

    const credentials: UserCredentials = {
      username: user.username,
      password: user.password,
    };

    const loggedInUser = (await loginUser(credentials)) as SafeDatabaseUser;

    expect(loggedInUser.username).toEqual(user.username);
    expect(loggedInUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should return the user if the password fails', async () => {
    mockingoose(UserModel).toReturn(null, 'findOne');

    const credentials: UserCredentials = {
      username: user.username,
      password: 'wrongPassword',
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
  });

  it('should return the user is not found', async () => {
    mockingoose(UserModel).toReturn(null, 'findOne');

    const credentials: UserCredentials = {
      username: 'wrongUsername',
      password: user.password,
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
  });
});

describe('deleteUserByUsername', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the deleted user when deleted succesfully', async () => {
    mockingoose(UserModel).toReturn(safeUser, 'findOneAndDelete');

    const deletedUser = (await deleteUserByUsername(user.username)) as SafeDatabaseUser;

    expect(deletedUser.username).toEqual(user.username);
    expect(deletedUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should throw an error if the username is not found', async () => {
    mockingoose(UserModel).toReturn(null, 'findOneAndDelete');

    const deletedError = await deleteUserByUsername(user.username);

    expect('error' in deletedError).toBe(true);
  });

  it('should throw an error if a database error while deleting', async () => {
    mockingoose(UserModel).toReturn(new Error('Error deleting object'), 'findOneAndDelete');

    const deletedError = await deleteUserByUsername(user.username);

    expect('error' in deletedError).toBe(true);
  });
});

describe('updateUser', () => {
  const updatedUser: User = {
    ...user,
    password: 'newPassword',
  };

  const safeUpdatedUser: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: user.username,
    dateJoined: user.dateJoined,
    friends: [],
  };

  const updates: Partial<User> = {
    password: 'newPassword',
  };

  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the updated user when updated succesfully', async () => {
    mockingoose(UserModel).toReturn(safeUpdatedUser, 'findOneAndUpdate');

    const result = (await updateUser(user.username, updates)) as SafeDatabaseUser;

    expect(result.username).toEqual(user.username);
    expect(result.username).toEqual(updatedUser.username);
    expect(result.dateJoined).toEqual(user.dateJoined);
    expect(result.dateJoined).toEqual(updatedUser.dateJoined);
  });

  it('should throw an error if the username is not found', async () => {
    mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');

    const updatedError = await updateUser(user.username, updates);

    expect('error' in updatedError).toBe(true);
  });

  it('should throw an error if a database error while deleting', async () => {
    mockingoose(UserModel).toReturn(new Error('Error updating object'), 'findOneAndUpdate');

    const updatedError = await updateUser(user.username, updates);

    expect('error' in updatedError).toBe(true);
  });

  it('should update the biography if the user is found', async () => {
    const newBio = 'This is a new biography';
    // Make a new partial updates object just for biography
    const biographyUpdates: Partial<User> = { biography: newBio };

    // Mock the DB to return a safe user (i.e., no password in results)
    mockingoose(UserModel).toReturn({ ...safeUpdatedUser, biography: newBio }, 'findOneAndUpdate');

    const result = await updateUser(user.username, biographyUpdates);

    // Check that the result is a SafeUser and the biography got updated
    if ('username' in result) {
      expect(result.biography).toEqual(newBio);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should return an error if biography update fails because user not found', async () => {
    // Simulate user not found
    mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');

    const newBio = 'No user found test';
    const biographyUpdates: Partial<User> = { biography: newBio };
    const updatedError = await updateUser(user.username, biographyUpdates);

    expect('error' in updatedError).toBe(true);
  });

  describe('setUserToQuietHours', () => {
    it('should update user status to busy with muteScope: everyone', async () => {
      mockingoose(UserModel).toReturn(safeUser, 'findOne');
      const updatedUser1 = {
        ...safeUser,
        onlineStatus: {
          status: 'busy',
          busySettings: { muteScope: 'everyone' },
        },
        oldStatus: { status: 'online' },
      };
      mockingoose(UserModel).toReturn(updatedUser1, 'findOneAndUpdate');
      const result = await setUserToQuietHours(user.username);
      expect(result).toHaveProperty('onlineStatus');
      if (!('error' in result)) {
        expect(result.onlineStatus?.status).toBe('busy');
      } else {
        throw new Error('Expected a user object, but got an error object.');
      }
    });

    it('should return error if user not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');
      const result = await setUserToQuietHours(user.username);
      expect('error' in result).toBe(true);
    });
  });

  describe('restoreUserFromQuietHours', () => {
    it('should restore old status and unset quiet hours', async () => {
      const userWithOldStatus = {
        ...safeUser,
        oldStatus: { status: 'away' },
      };
      const updatedUser1 = {
        ...safeUser,
        onlineStatus: { status: 'away' },
        oldStatus: undefined,
      };
      mockingoose(UserModel).toReturn(userWithOldStatus, 'findOne');
      mockingoose(UserModel).toReturn(updatedUser1, 'findOneAndUpdate');
      const result = await restoreUserFromQuietHours(user.username);
      expect(result).toHaveProperty('onlineStatus');
      if (!('error' in result)) {
        expect(result.onlineStatus?.status).toBe('away');
      } else {
        throw new Error('Expected a user object, but got an error object.');
      }
    });
    it('should return error if user not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');
      const result = await restoreUserFromQuietHours(user.username);
      expect('error' in result).toBe(true);
    });
  });

  describe('updateUserQuietHours', () => {
    it('should update quiet hours when value is provided', async () => {
      const updated = { ...safeUser, quietHours: { start: '01:00', end: '23:00' } };
      mockingoose(UserModel).toReturn(updated, 'findOneAndUpdate');
      const result = await updateUserQuietHours(user.username, updated.quietHours);
      expect(result).toHaveProperty('quietHours');
    });

    it('should clear quiet hours when called without value', async () => {
      const updatedUser1 = { ...safeUser, quietHours: undefined, oldStatus: undefined };
      mockingoose(UserModel).toReturn(updatedUser1, 'findOneAndUpdate');
      const result = await updateUserQuietHours(user.username);
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.quietHours).toBeUndefined();
      } else {
        throw new Error('Expected a user object, but got an error object.');
      }
    });


    it('should return error if update fails', async () => {
      mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');
      const result = await updateUserQuietHours(user.username, { start: '00:00', end: '01:00' });
      expect('error' in result).toBe(true);
    });

    it('should return error if update throws', async () => {
      mockingoose(UserModel).toReturn(new Error('update error'), 'findOneAndUpdate');
      const result = await updateUserQuietHours(user.username, { start: '00:00', end: '01:00' });
      expect('error' in result).toBe(true);
    });
  });

  describe('updateUserPrivacySettings', () => {
    const mockUsername = 'privacyTestUser';
    const mockPrivacySettings: PrivacySettings = {
      profileVisibility: 'private',
    };

    const mockUser: SafeDatabaseUser = {
      _id: new mongoose.Types.ObjectId(),
      username: mockUsername,
      dateJoined: new Date(),
      friends: [],
      privacySettings: mockPrivacySettings,
    };

    beforeEach(() => {
      mockingoose.resetAll();
    });

    it('should return updated user if update is successful', async () => {
      mockingoose(UserModel).toReturn(mockUser, 'findOneAndUpdate');
      const result = await updateUserPrivacySettings(mockUsername, mockPrivacySettings);
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result).toHaveProperty('username', mockUsername);
        expect(result).toHaveProperty('privacySettings');
        expect(result.privacySettings?.profileVisibility).toBe('private');
      } else {
        throw new Error("Expected a user object, but got an error object.");
      }
    });

    it('should return error if updateUser returns null (user not found)', async () => {
      mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');
      const result = await updateUserPrivacySettings(mockUsername, mockPrivacySettings);
      expect('error' in result).toBe(true);
    });

    it('should return error if updateUser throws an exception', async () => {
      mockingoose(UserModel).toReturn(new Error('Update failed'), 'findOneAndUpdate');
      const result = await updateUserPrivacySettings(mockUsername, mockPrivacySettings);
      expect('error' in result).toBe(true);
    });
  });
});
