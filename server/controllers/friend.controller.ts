import express, { Response, Request } from 'express';
import { ObjectId } from 'mongodb';
import { FakeSOSocket } from '../types/types';
import {
  createFriendRequest,
  updateFriendRequestStatus,
  getFriendRequestsByUsername,
  getPendingFriendRequests,
  getFriendsByUsername,
  getMutualFriends,
  deleteFriendRequest,
} from '../services/friend.service';

/**
 * This controller handles friend request-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the friend request routes.
 */
const friendRequestController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Validates that the request body contains all required fields for creating a friend request.
   * @param req The incoming request containing friend request data.
   * @returns `true` if the body contains valid fields; otherwise, `false`.
   */
  const isCreateRequestValid = (req: Request): boolean => {
    const { requester, recipient } = req.body;
    return !!requester && !!recipient && requester !== recipient;
  };

  /**
   * Validates that the request body contains all required fields for updating a friend request status.
   * @param req The incoming request containing status update data.
   * @returns `true` if the body contains valid fields; otherwise, `false`.
   */
  const isUpdateStatusValid = (req: Request): boolean => {
    const { requestId, status } = req.body;
    return (
      !!requestId &&
      !!status &&
      ['pending', 'accepted', 'rejected'].includes(status)
    );
  };

  /**
   * Creates a new friend request from one user to another.
   * @param req The request object containing requester and recipient usernames.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the friend request is created.
   */
  const createRequest = async (req: Request, res: Response): Promise<void> => {
    if (!req.body || !isCreateRequestValid(req)) {
      res.status(400).send('Invalid friend request data');
      return;
    }

    const { requester, recipient } = req.body;

    try {
      const result = await createFriendRequest(requester, recipient);

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Emit socket event for real-time updates
      socket.emit('friendRequestUpdate', {
        friendRequest: result,
        type: 'created',
      });

      res.status(201).json(result);
    } catch (err: unknown) {
      res
        .status(500)
        .send(`Error creating friend request: ${(err as Error).message}`);
    }
  };

  /**
   * Updates the status of a friend request (accept/reject).
   * @param req The request object containing request ID and new status.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the status is updated.
   */
  const updateRequestStatus = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    if (!req.body || !isUpdateStatusValid(req)) {
      res.status(400).send('Invalid status update data');
      return;
    }

    const { requestId, status } = req.body;

    try {
      const result = await updateFriendRequestStatus(
        requestId,
        status as 'pending' | 'accepted' | 'rejected',
      );

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Emit socket event for real-time updates
      socket.emit('friendRequestUpdate', {
        friendRequest: result,
        type: 'updated',
      });

      res.status(200).json(result);
    } catch (err: unknown) {
      res
        .status(500)
        .send(
          `Error updating friend request status: ${(err as Error).message}`,
        );
    }
  };

  /**
   * Gets all friend requests for a user.
   * @param req The request object containing the username.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the requests are retrieved.
   */
  const getRequestsByUsername = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { username } = req.params;

    try {
      const requests = await getFriendRequestsByUsername(username);

      if ('error' in requests) {
        throw new Error(requests.error);
      }

      res.status(200).json(requests);
    } catch (err: unknown) {
      res
        .status(500)
        .send(`Error getting friend requests: ${(err as Error).message}`);
    }
  };

  /**
   * Gets pending friend requests for a user.
   * @param req The request object containing the username.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the requests are retrieved.
   */
  const getPendingRequests = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { username } = req.params;

    try {
      const pendingRequests = await getPendingFriendRequests(username);

      if ('error' in pendingRequests) {
        throw new Error(pendingRequests.error);
      }

      res.status(200).json(pendingRequests);
    } catch (err: unknown) {
      res
        .status(500)
        .send(`Error getting pending requests: ${(err as Error).message}`);
    }
  };

  /**
   * Gets all friends of a user.
   * @param req The request object containing the username.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the friends are retrieved.
   */
  const getFriends = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;

    try {
      const friends = await getFriendsByUsername(username);

      if ('error' in friends) {
        throw new Error(friends.error);
      }

      res.status(200).json(friends);
    } catch (err: unknown) {
      res.status(500).send(`Error getting friends: ${(err as Error).message}`);
    }
  };

  /**
   * Deletes a friend request.
   * @param req The request object containing the request ID.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the request is deleted.
   */
  const deleteRequest = async (req: Request, res: Response): Promise<void> => {
    const { requestId } = req.params;

    if (!requestId || !ObjectId.isValid(requestId)) {
      res.status(400).send('Valid request ID is required');
      return;
    }

    try {
      const result = await deleteFriendRequest(requestId);

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Emit socket event
      socket.emit('friendRequestUpdate', {
        friendRequest: result,
        type: 'deleted',
      });

      res.status(200).json(result);
    } catch (err) {
      res
        .status(500)
        .send(`Error deleting friend request: ${(err as Error).message}`);
    }
  };

  /**
   * Gets mutual friends between two users.
   * @param req The request object containing both usernames.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when mutual friends are found.
   */
  const getMutualFriendsHandler = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { username1, username2 } = req.params;

    try {
      const mutualFriends = await getMutualFriends(username1, username2);

      if ('error' in mutualFriends) {
        throw new Error(mutualFriends.error);
      }

      res.status(200).json(mutualFriends);
    } catch (err: unknown) {
      res
        .status(500)
        .send(`Error getting mutual friends: ${(err as Error).message}`);
    }
  };

  // Setup socket event listeners for friend requests
  socket.on('connection', (conn) => {
    conn.on('joinFriendRequests', (username: string) => {
      // A user can join a "room" with their username to receive their friend request updates
      conn.join(`friend-requests-${username}`);
    });

    conn.on('leaveFriendRequests', (username: string) => {
      conn.leave(`friend-requests-${username}`);
    });
  });

  // Define routes
  router.post('/request', createRequest);
  router.put('/request/status', updateRequestStatus);
  router.get('/requests/:username', getRequestsByUsername);
  router.get('/requests/pending/:username', getPendingRequests);
  router.get('/friends/:username', getFriends);
  router.get('/mutual/:username1/:username2', getMutualFriendsHandler);
  router.delete('/request/:requestId', deleteRequest);

  return router;
};

export default friendRequestController;
