import express, { Request, Response, Router } from 'express';
import {
  UserRequest,
  User,
  UserCredentials,
  UserByUsernameRequest,
  FakeSOSocket,
  UpdateBiographyRequest,
  UpdatePrivacySettingsRequest,
  UpdateOnlineStatusRequest,
  BlockUserRequest,
} from '../types/types';
import {
  deleteUserByUsername,
  getUserByUsername,
  getUsersList,
  loginUser,
  saveUser,
  updateUser,
  updateUserPrivacySettings,
  blockUser,
  unblockUser,
} from '../services/user.service';

const userController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  /**
   * Validates that the request body contains all required fields for a user.
   * @param req The incoming request containing user data.
   * @returns `true` if the body contains valid user fields; otherwise, `false`.
   */
  const isUserBodyValid = (req: UserRequest): boolean =>
    req.body !== undefined &&
    req.body.username !== undefined &&
    req.body.username !== '' &&
    req.body.password !== undefined &&
    req.body.password !== '';

  /**
   * Validates that the request body contains all required fields to update a biography.
   * @param req The incoming request containing user data.
   * @returns `true` if the body contains valid user fields; otherwise, `false`.
   */
  const isUpdateBiographyBodyValid = (req: UpdateBiographyRequest): boolean =>
    req.body !== undefined &&
    req.body.username !== undefined &&
    req.body.username.trim() !== '' &&
    req.body.biography !== undefined;

  const isOnlineStatusBodyValid = (req: UpdateOnlineStatusRequest): boolean =>
    req.body !== undefined &&
    req.body.username !== undefined &&
    req.body.username.trim() !== '' &&
    req.body.onlineStatus !== undefined &&
    ['online', 'away', 'busy', 'invisible'].includes(
      req.body.onlineStatus.status,
    ) &&
    (req.body.onlineStatus.status !== 'busy' ||
      ['friends-only', 'everyone'].includes(
        req.body.onlineStatus.busySettings?.muteScope || '',
      ));

  /**
   * Validates that the request body contains all required fields to update privacy settings.
   * @param req The incoming request containing user data.
   * @returns `true` if the body contains valid user fields; otherwise, `false`.
   */
  const isUpdatePrivacySettingsBodyValid = (
    req: UpdatePrivacySettingsRequest,
  ): boolean =>
    req.body !== undefined &&
    req.body.username !== undefined &&
    req.body.username.trim() !== '' &&
    req.body.privacySettings !== undefined &&
    req.body.privacySettings.profileVisibility !== undefined &&
    (req.body.privacySettings.profileVisibility === 'public' ||
      req.body.privacySettings.profileVisibility === 'private');

  /**
   * Validates that the request body contains all required fields for a block/unblock action.
   * @param req The incoming request containing block data.
   * @returns `true` if the body contains valid block fields; otherwise, `false`.
   */
  const isBlockBodyValid = (req: BlockUserRequest): boolean =>
    req.body !== undefined &&
    req.body.username !== undefined &&
    req.body.username.trim() !== '' &&
    req.body.userToBlock !== undefined &&
    req.body.userToBlock.trim() !== '' &&
    req.body.username !== req.body.userToBlock;

  /**
   * Handles the creation of a new user account.
   * @param req The request containing username, email, and password in the body.
   * @param res The response, either returning the created user or an error.
   * @returns A promise resolving to void.
   */
  const createUser = async (req: UserRequest, res: Response): Promise<void> => {
    if (!isUserBodyValid(req)) {
      res.status(400).send('Invalid user body');
      return;
    }

    const requestUser = req.body;

    const user: User = {
      ...requestUser,
      dateJoined: new Date(),
      biography: requestUser.biography ?? '',
      quietHours: undefined,
    };

    try {
      const result = await saveUser(user);

      if ('error' in result) {
        throw new Error(result.error);
      }

      socket.emit('userUpdate', {
        user: result,
        type: 'created',
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when saving user: ${error}`);
    }
  };

  /**
   * Handles user login by validating credentials.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const userLogin = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      if (!isUserBodyValid(req)) {
        res.status(400).send('Invalid user body');
        return;
      }

      const loginCredentials: UserCredentials = {
        username: req.body.username,
        password: req.body.password,
      };

      const user = await loginUser(loginCredentials);

      if ('error' in user) {
        throw Error(user.error);
      }

      // Preserve previous status if not "online"
      const finalStatus =
        user.onlineStatus?.status && user.onlineStatus.status !== 'online'
          ? user.onlineStatus
          : { status: 'online' };

      // Update the user's status in the DB (only if necessary)
      const updatedUser = await updateUser(user.username, {
        onlineStatus: finalStatus,
      });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      // Emit real-time update to other users
      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      // Return the updated user to the logging-in user
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send('Login failed');
    }
  };

  /**
   * Retrieves a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const getUser = async (
    req: UserByUsernameRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { username } = req.params;

      const user = await getUserByUsername(username);

      if ('error' in user) {
        throw Error(user.error);
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send(`Error when getting user by username: ${error}`);
    }
  };

  /**
   * Retrieves all users from the database.
   * @param res The response, either returning the users or an error.
   * @returns A promise resolving to void.
   */
  const getUsers = async (_: Request, res: Response): Promise<void> => {
    try {
      const users = await getUsersList();

      if ('error' in users) {
        throw Error(users.error);
      }

      res.status(200).json(users);
    } catch (error) {
      res.status(500).send(`Error when getting users: ${error}`);
    }
  };

  /**
   * Deletes a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either confirming deletion or returning an error.
   * @returns A promise resolving to void.
   */
  const deleteUser = async (
    req: UserByUsernameRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { username } = req.params;

      const deletedUser = await deleteUserByUsername(username);

      if ('error' in deletedUser) {
        throw Error(deletedUser.error);
      }

      socket.emit('userUpdate', {
        user: deletedUser,
        type: 'deleted',
      });
      res.status(200).json(deletedUser);
    } catch (error) {
      res.status(500).send(`Error when deleting user by username: ${error}`);
    }
  };

  /**
   * Resets a user's password.
   * @param req The request containing the username and new password in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const resetPassword = async (
    req: UserRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!isUserBodyValid(req)) {
        res.status(400).send('Invalid user body');
        return;
      }

      const updatedUser = await updateUser(req.body.username, {
        password: req.body.password,
      });

      if ('error' in updatedUser) {
        throw Error(updatedUser.error);
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user password: ${error}`);
    }
  };

  /**
   * Updates a user's biography.
   * @param req The request containing the username and biography in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateBiography = async (
    req: UpdateBiographyRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!isUpdateBiographyBodyValid(req)) {
        res.status(400).send('Invalid user body');
        return;
      }

      // Validate that request has username and biography
      const { username, biography } = req.body;

      // Call the same updateUser(...) service used by resetPassword
      const updatedUser = await updateUser(username, { biography });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      // Emit socket event for real-time updates
      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user biography: ${error}`);
    }
  };

  /**
   * Updates a user's privacy settings.
   * @param req The request containing the username and privacy settings in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updatePrivacySettings = async (
    req: UpdatePrivacySettingsRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!isUpdatePrivacySettingsBodyValid(req)) {
        res.status(400).send('Invalid privacy settings body');
        return;
      }

      // Extract the username and privacy settings from the request body
      const { username, privacySettings } = req.body;

      // Call the user service function to update the privacy settings
      const updatedUser = await updateUserPrivacySettings(
        username,
        privacySettings,
      );

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      // Emit socket event for real-time updates
      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating privacy settings: ${error}`);
    }
  };

  const updateOnlineStatus = async (
    req: UpdateOnlineStatusRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!isOnlineStatusBodyValid(req)) {
        res.status(400).send('Invalid status update body');
        return;
      }

      const { username, onlineStatus } = req.body;

      const updatedUser = await updateUser(username, { onlineStatus });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating online status: ${error}`);
    }
  };

  /**
   * Handles blocking a user.
   * @param req The request containing the username and the user to block.
   * @param res The response, either returning the updated user or an error.
   * @returns A promise resolving to void.
   */
  const handleBlockUser = async (
    req: BlockUserRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!isBlockBodyValid(req)) {
        res.status(400).send('Invalid block request');
        return;
      }

      const { username, userToBlock } = req.body;

      const result = await blockUser(username, userToBlock);

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Emit socket event for real-time updates
      socket.emit('userUpdate', {
        user: result,
        type: 'updated',
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error blocking user: ${error}`);
    }
  };

  /**
   * Handles unblocking a user.
   * @param req The request containing the username and the user to unblock.
   * @param res The response, either returning the updated user or an error.
   * @returns A promise resolving to void.
   */
  const handleUnblockUser = async (
    req: BlockUserRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!isBlockBodyValid(req)) {
        res.status(400).send('Invalid unblock request');
        return;
      }

      const { username, userToBlock: userToUnblock } = req.body;

      const result = await unblockUser(username, userToUnblock);

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Emit socket event for real-time updates
      socket.emit('userUpdate', {
        user: result,
        type: 'updated',
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error unblocking user: ${error}`);
    }
  };

  // Define routes for the user-related operations.
  router.post('/signup', createUser);
  router.post('/login', userLogin);
  router.patch('/resetPassword', resetPassword);
  router.get('/getUser/:username', getUser);
  router.get('/getUsers', getUsers);
  router.delete('/deleteUser/:username', deleteUser);
  router.patch('/updateBiography', updateBiography);
  router.patch('/updatePrivacySettings', updatePrivacySettings);
  router.patch('/updateOnlineStatus', updateOnlineStatus);
  router.post('/block', handleBlockUser);
  router.post('/unblock', handleUnblockUser);
  return router;
};

export default userController;
