import express, { Response, Request } from 'express';
import { ObjectId } from 'mongodb';
import { FakeSOSocket } from '../types/types';
import FriendRequestModel from '../models/friend-request.model';
import UserModel from '../models/users.model';

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
      // Check if a request already exists between these users
      const requesterUser = await UserModel.findOne({ username: requester });
      const recipientUser = await UserModel.findOne({ username: recipient });

      if (!requesterUser || !recipientUser) {
        res.status(404).send('One or both users not found');
        return;
      }

      const existingRequest = await FriendRequestModel.findOne({
        $or: [
          { requester: requesterUser._id, recipient: recipientUser._id },
          { requester: recipientUser._id, recipient: requesterUser._id },
        ],
      });

      if (existingRequest) {
        res.status(409).send('Friend request already exists');
        return;
      }

      // Create new friend request
      const friendRequest = new FriendRequestModel({
        requester: requesterUser._id,
        recipient: recipientUser._id,
        // Status is 'pending' by default
        // requestedAt and updatedAt will default to current date
      });

      await friendRequest.save();

      // Populate the user details for response
      const populatedRequest = await FriendRequestModel.findById(
        friendRequest._id,
      )
        .populate('requester', 'username')
        .populate('recipient', 'username');

      // Emit socket event for real-time updates
      socket.emit('friendRequestUpdate', {
        friendRequest: populatedRequest,
        type: 'created',
      });

      res.status(201).json(populatedRequest);
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
      // Find and update the request
      const friendRequest = await FriendRequestModel.findByIdAndUpdate(
        requestId,
        {
          status,
          updatedAt: new Date(),
        },
        { new: true },
      )
        .populate('requester', 'username')
        .populate('recipient', 'username');

      if (!friendRequest) {
        res.status(404).send('Friend request not found');
        return;
      }

      // Emit socket event for real-time updates
      socket.emit('friendRequestUpdate', {
        friendRequest,
        type: 'updated',
      });

      res.status(200).json(friendRequest);
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

    if (!username) {
      res.status(400).send('Username is required');
      return;
    }

    try {
      // Find user by username
      const user = await UserModel.findOne({ username });

      if (!user) {
        res.status(404).send('User not found');
        return;
      }

      // Get all requests where user is either requester or recipient
      const requests = await FriendRequestModel.find({
        $or: [{ requester: user._id }, { recipient: user._id }],
      })
        .populate('requester', 'username')
        .populate('recipient', 'username')
        .sort({ updatedAt: -1 });

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

    if (!username) {
      res.status(400).send('Username is required');
      return;
    }

    try {
      // Find user by username
      const user = await UserModel.findOne({ username });

      if (!user) {
        res.status(404).send('User not found');
        return;
      }

      // Get pending requests where user is the recipient
      const pendingRequests = await FriendRequestModel.find({
        recipient: user._id,
        status: 'pending',
      })
        .populate('requester', 'username')
        .populate('recipient', 'username')
        .sort({ requestedAt: -1 });

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

    if (!username) {
      res.status(400).send('Username is required');
      return;
    }

    try {
      // Find user by username
      const user = await UserModel.findOne({ username });

      if (!user) {
        res.status(404).send('User not found');
        return;
      }

      // Find accepted friend requests
      const acceptedRequests = await FriendRequestModel.find({
        $or: [
          { requester: user._id, status: 'accepted' },
          { recipient: user._id, status: 'accepted' },
        ],
      })
        .populate('requester', 'username')
        .populate('recipient', 'username');

      // Extract friend details
      const friends = acceptedRequests.map((request) => {
        // Determine which user in the request is the friend
        const isFriendRequester =
          String(request.recipient._id) === String(user._id);

        // Add type assertion here to tell TypeScript these are populated documents
        const friendUser = isFriendRequester
          ? (request.requester as unknown as {
              _id: ObjectId;
              username: string;
            })
          : (request.recipient as unknown as {
              _id: ObjectId;
              username: string;
            });

        return {
          _id: friendUser._id,
          username: friendUser.username,
          requestId: request._id,
        };
      });

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
      // Get the request before deleting for socket event
      const friendRequest = await FriendRequestModel.findById(requestId)
        .populate('requester', 'username')
        .populate('recipient', 'username');

      if (!friendRequest) {
        res.status(404).send('Friend request not found');
        return;
      }

      // Delete the request
      await FriendRequestModel.findByIdAndDelete(requestId);

      // Emit socket event
      socket.emit('friendRequestUpdate', {
        friendRequest,
        type: 'deleted',
      });

      res.status(200).json(friendRequest);
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
  const getMutualFriends = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { username1, username2 } = req.params;

    if (!username1 || !username2) {
      res.status(400).send('Both usernames are required');
      return;
    }

    try {
      // Find users by usernames
      const user1 = await UserModel.findOne({ username: username1 });
      const user2 = await UserModel.findOne({ username: username2 });

      if (!user1 || !user2) {
        res.status(404).send('One or both users not found');
        return;
      }

      // Get friends for user1
      const user1friends = await FriendRequestModel.find({
        $or: [
          { requester: user1._id, status: 'accepted' },
          { recipient: user1._id, status: 'accepted' },
        ],
      });

      const user1FriendIds = user1friends.map((friend) =>
        friend.requester.equals(user1._id)
          ? friend.recipient
          : friend.requester,
      );

      // Get friends for user2
      const user2friends = await FriendRequestModel.find({
        $or: [
          { requester: user2._id, status: 'accepted' },
          { recipient: user2._id, status: 'accepted' },
        ],
      });

      const user2FriendIds = user2friends.map((friend) =>
        friend.requester.equals(user2._id)
          ? friend.recipient
          : friend.requester,
      );

      // Find mutual friends by comparing the two friend lists
      const mutualFriendIds = user1FriendIds.filter((id1) =>
        user2FriendIds.some((id2) => id2.equals(id1)),
      );

      // Get user details for mutual friends
      const mutualFriends = await UserModel.find({
        _id: { $in: mutualFriendIds },
      }).select('-password');

      res.status(200).json(mutualFriends);
    } catch (err: unknown) {
      res
        .status(500)
        .send(`Error getting mutual friends: ${(err as Error).message}`);
    }
  };

  // Setup socket event listeners for friend requests
  socket.on('connection', (conn) => {
    // Here you can add any friend request specific socket events if needed
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
  router.get('/mutual/:username1/:username2', getMutualFriends);
  router.delete('/request/:requestId', deleteRequest);

  return router;
};

export default friendRequestController;
