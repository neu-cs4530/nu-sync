import UserModel from '../models/users.model';
import {
  DatabaseUser,
  SafeDatabaseUser,
  User,
  UserCredentials,
  UserResponse,
  UsersResponse,
  PrivacySettings,
} from '../types/types';

/**
 * Saves a new user to the database.
 *
 * @param {User} user - The user object to be saved, containing user details like username, password, etc.
 * @returns {Promise<UserResponse>} - Resolves with the saved user object (without the password) or an error message.
 */
export const saveUser = async (user: User): Promise<UserResponse> => {
  try {
    const result: DatabaseUser = await UserModel.create(user);

    if (!result) {
      throw Error('Failed to create user');
    }

    // Remove password field from returned object
    const safeUser: SafeDatabaseUser = {
      _id: result._id,
      username: result.username,
      dateJoined: result.dateJoined,
      biography: result.biography,
      friends: result.friends,
      quietHours: result.quietHours ?? undefined,
      blockedUsers: result.blockedUsers,
    };

    return safeUser;
  } catch (error) {
    return { error: `Error occurred when saving user: ${error}` };
  }
};

/**
 * Retrieves a user from the database by their username.
 *
 * @param {string} username - The username of the user to find.
 * @returns {Promise<UserResponse>} - Resolves with the found user object (without the password) or an error message.
 */
export const getUserByUsername = async (
  username: string,
): Promise<UserResponse> => {
  try {
    const user: SafeDatabaseUser | null = await UserModel.findOne({
      username,
    }).select('-password');

    if (!user) {
      throw Error('User not found');
    }

    return user;
  } catch (error) {
    return { error: `Error occurred when finding user: ${error}` };
  }
};

/**
 * Retrieves all users from the database.
 * Users documents are returned in the order in which they were created, oldest to newest.
 *
 * @returns {Promise<UsersResponse>} - Resolves with the found user objects (without the passwords) or an error message.
 */
export const getUsersList = async (): Promise<UsersResponse> => {
  try {
    const users: SafeDatabaseUser[] =
      await UserModel.find().select('-password');

    if (!users) {
      throw Error('Users could not be retrieved');
    }

    return users;
  } catch (error) {
    return { error: `Error occurred when finding users: ${error}` };
  }
};

/**
 * Authenticates a user by verifying their username and password.
 *
 * @param {UserCredentials} loginCredentials - An object containing the username and password.
 * @returns {Promise<UserResponse>} - Resolves with the authenticated user object (without the password) or an error message.
 */
export const loginUser = async (
  loginCredentials: UserCredentials,
): Promise<UserResponse> => {
  const { username, password } = loginCredentials;

  try {
    const user: SafeDatabaseUser | null = await UserModel.findOne({
      username,
      password,
    }).select('-password');

    if (!user) {
      throw Error('Authentication failed');
    }

    return user;
  } catch (error) {
    return { error: `Error occurred when authenticating user: ${error}` };
  }
};

/**
 * Deletes a user from the database by their username.
 *
 * @param {string} username - The username of the user to delete.
 * @returns {Promise<UserResponse>} - Resolves with the deleted user object (without the password) or an error message.
 */
export const deleteUserByUsername = async (
  username: string,
): Promise<UserResponse> => {
  try {
    const deletedUser: SafeDatabaseUser | null =
      await UserModel.findOneAndDelete({
        username,
      }).select('-password');

    if (!deletedUser) {
      throw Error('Error deleting user');
    }

    return deletedUser;
  } catch (error) {
    return { error: `Error occurred when finding user: ${error}` };
  }
};

/**
 * Updates user information in the database.
 *
 * @param {string} username - The username of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateUser = async (
  username: string,
  updates: Partial<User>,
): Promise<UserResponse> => {
  try {
    const updatedUser: SafeDatabaseUser | null =
      await UserModel.findOneAndUpdate(
        { username },
        { $set: updates },
        { new: true },
      ).select('-password');

    if (!updatedUser) {
      throw Error('Error updating user');
    }

    return updatedUser;
  } catch (error) {
    return { error: `Error occurred when updating user: ${error}` };
  }
};

/**
 * Updates a user's privacy settings.
 *
 * @param {string} username - The username of the user to update.
 * @param {PrivacySettings} privacySettings - The new privacy settings to apply.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateUserPrivacySettings = async (
  username: string,
  privacySettings: PrivacySettings,
): Promise<UserResponse> => {
  try {
    // Use the existing updateUser function to update the privacy settings
    const updatedUser = await updateUser(username, { privacySettings });

    if ('error' in updatedUser) {
      throw Error(updatedUser.error);
    }

    return updatedUser;
  } catch (error) {
    return { error: `Error occurred when updating privacy settings: ${error}` };
  }
};

export const setUserToQuietHours = async (username: string) => {
  const user = await getUserByUsername(username);
  if ('error' in user) return user;

  return updateUser(username, {
    oldStatus: user.onlineStatus ?? { status: 'online' },
    onlineStatus: {
      status: 'busy',
      busySettings: { muteScope: 'everyone' },
    },
  });
};

export const restoreUserFromQuietHours = async (username: string) => {
  const user = await getUserByUsername(username);
  if ('error' in user) return user;

  return updateUser(username, {
    onlineStatus: user.oldStatus ?? { status: 'online' },
    oldStatus: undefined,
  });
};

export const updateUserQuietHours = async (
  username: string,
  quietHours?: { start: string; end: string },
): Promise<UserResponse> => {
  try {
    let updatedUser: SafeDatabaseUser | null;

    if (quietHours) {
      updatedUser = await UserModel.findOneAndUpdate(
        { username },
        { $set: { quietHours } },
        { new: true },
      ).select('-password');
    } else {
      updatedUser = await UserModel.findOneAndUpdate(
        { username },
        { $unset: { quietHours: '', oldStatus: '' } },
        { new: true },
      ).select('-password');
    }

    if (!updatedUser) {
      throw Error('Error updating quiet hours');
    }

    return updatedUser;
  } catch (error) {
    return { error: `Error occurred when updating quiet hours: ${error}` };
  }
};

/**
 * Blocks a user by adding them to the blocker's blockedUsers array.
 *
 * @param {string} blocker - Username of the user performing the block.
 * @param {string} blocked - Username of the user being blocked.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const blockUser = async (
  blocker: string,
  blocked: string,
): Promise<UserResponse> => {
  try {
    // Check if the blocker and blocked users exist
    const blockerUser = await UserModel.findOne({ username: blocker });
    const blockedUser = await UserModel.findOne({ username: blocked });

    if (!blockerUser || !blockedUser) {
      return { error: 'One or both users not found' };
    }

    // Check if attempting to block oneself
    if (blocker === blocked) {
      return { error: 'Cannot block yourself' };
    }

    // Check if already blocked
    const typedUser = blockerUser as unknown as DatabaseUser;
    if (typedUser.blockedUsers && typedUser.blockedUsers.includes(blocked)) {
      return { error: 'User is already blocked' };
    }

    // Add the blocked user to the blocker's blockedUsers array
    const updatedUser: SafeDatabaseUser | null =
      await UserModel.findOneAndUpdate(
        { username: blocker },
        { $addToSet: { blockedUsers: blocked } },
        { new: true },
      ).select('-password');

    if (!updatedUser) {
      throw Error('Error updating blocked users');
    }

    return updatedUser;
  } catch (error) {
    return { error: `Error occurred when blocking user: ${error}` };
  }
};

/**
 * Unblocks a user by removing them from the blocker's blockedUsers array.
 *
 * @param {string} blocker - Username of the user performing the unblock.
 * @param {string} blocked - Username of the user being unblocked.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const unblockUser = async (
  blocker: string,
  blocked: string,
): Promise<UserResponse> => {
  try {
    // Check if the blocker and blocked users exist
    const blockerUser = await UserModel.findOne({ username: blocker });
    const blockedUser = await UserModel.findOne({ username: blocked });

    if (!blockerUser || !blockedUser) {
      return { error: 'One or both users not found' };
    }

    // Remove the blocked user from the blocker's blockedUsers array
    const updatedUser: SafeDatabaseUser | null =
      await UserModel.findOneAndUpdate(
        { username: blocker },
        { $pull: { blockedUsers: blocked } },
        { new: true },
      ).select('-password');

    if (!updatedUser) {
      throw Error('Error updating blocked users');
    }

    return updatedUser;
  } catch (error) {
    return { error: `Error occurred when unblocking user: ${error}` };
  }
};

/**
 * Checks if a user is blocked by another user.
 *
 * @param {string} blocker - Username of the potential blocker.
 * @param {string} potentiallyBlocked - Username of the user to check if blocked.
 * @returns {Promise<boolean | { error: string }>} - Resolves with true if blocked, false if not, or an error message.
 */
export const isUserBlocked = async (
  blocker: string,
  potentiallyBlocked: string,
): Promise<boolean | { error: string }> => {
  try {
    const user = await UserModel.findOne({ username: blocker });

    if (!user) {
      return { error: 'User not found' };
    }

    // Cast the MongoDB document to DatabaseUser type
    const typedUser = user as unknown as DatabaseUser;
    return !!(
      typedUser.blockedUsers &&
      typedUser.blockedUsers.includes(potentiallyBlocked)
    );
  } catch (error) {
    return { error: `Error occurred when checking block status: ${error}` };
  }
};
