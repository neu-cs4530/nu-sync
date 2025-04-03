import FriendRequestModel from '../models/friend-request.model';
import UserModel from '../models/users.model';
import {
  DatabaseFriendRequest,
  SafeDatabaseUser,
  DatabaseUser,
  FriendConnectionResponse,
} from '../types/types';

/**
 * Creates a new friend request from a requester to a recipient.
 *
 * @param {string} requesterUsername - The username of the user sending the friend request.
 * @param {string} recipientUsername - The username of the user receiving the friend request.
 * @returns {Promise<DatabaseFriendRequest | { error: string }>} - The created friend request or an error message.
 */
export const createFriendRequest = async (
  requesterUsername: string,
  recipientUsername: string,
): Promise<DatabaseFriendRequest | { error: string }> => {
  try {
    // Find both users by username
    const requesterUser: DatabaseUser | null = await UserModel.findOne({
      username: requesterUsername,
    });
    const recipientUser: DatabaseUser | null = await UserModel.findOne({
      username: recipientUsername,
    });

    if (!requesterUser || !recipientUser) {
      return { error: 'One or both users not found' };
    }

    // Check if users are the same
    if (requesterUsername === recipientUsername) {
      return { error: 'Cannot send friend request to yourself' };
    }

    // Check if a request already exists between these users
    const existingRequest: DatabaseFriendRequest | null =
      await FriendRequestModel.findOne({
        $or: [
          { requester: requesterUser._id, recipient: recipientUser._id },
          { requester: recipientUser._id, recipient: requesterUser._id },
        ],
      });

    if (existingRequest) {
      return { error: 'Friend request already exists between these users' };
    }

    // Create new friend request
    const friendRequest = new FriendRequestModel({
      requester: requesterUser._id,
      recipient: recipientUser._id,
      // status, requestedAt, and updatedAt will use default values from schema
    });

    const result: DatabaseFriendRequest = await friendRequest.save();

    // Populate the user details for response
    const populatedRequest: DatabaseFriendRequest | null =
      await FriendRequestModel.findById(result._id)
        .populate('requester', 'username')
        .populate('recipient', 'username');

    if (!populatedRequest) {
      throw Error('Failed to create friend request');
    }

    return populatedRequest;
  } catch (error) {
    return { error: `Error occurred when creating friend request: ${error}` };
  }
};

/**
 * Updates the status of a friend request.
 *
 * @param {string} requestId - The ID of the friend request to update.
 * @param {string} status - The new status of the friend request.
 * @returns {Promise<DatabaseFriendRequest | { error: string }>} - The updated friend request or an error message.
 */
export const updateFriendRequestStatus = async (
  requestId: string,
  status: 'pending' | 'accepted' | 'rejected',
): Promise<DatabaseFriendRequest | { error: string }> => {
  try {
    // Find and update the request
    const friendRequest: DatabaseFriendRequest | null =
      await FriendRequestModel.findByIdAndUpdate(
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
      return { error: 'Friend request not found' };
    }
    return friendRequest;
  } catch (error) {
    return {
      error: `Error occurred when updating friend request status: ${error}`,
    };
  }
};

/**
 * Gets all friend requests for a user (both sent and received).
 *
 * @param {string} username - The username of the user.
 * @returns {Promise<DatabaseFriendRequest[] | { error: string }>} - All friend requests for the user or an error message.
 */
export const getFriendRequestsByUsername = async (
  username: string,
): Promise<DatabaseFriendRequest[] | { error: string }> => {
  try {
    // Find user by username
    const user: DatabaseUser | null = await UserModel.findOne({ username });

    if (!user) {
      return { error: 'User not found' };
    }

    // Get all requests where user is either requester or recipient
    const requests: DatabaseFriendRequest[] = await FriendRequestModel.find({
      $or: [{ requester: user._id }, { recipient: user._id }],
    })
      .populate({
        path: 'requester',
        select: 'username',
      })
      .populate({
        path: 'recipient',
        select: 'username',
      })
      .sort({ updatedAt: -1 });

    return requests;
  } catch (error) {
    return { error: `Error occurred when getting friend requests: ${error}` };
  }
};

/**
 * Gets pending friend requests for a user (only those they've received).
 *
 * @param {string} username - The username of the user.
 * @returns {Promise<DatabaseFriendRequest[] | { error: string }>} - Pending friend requests for the user or an error message.
 */
export const getPendingFriendRequests = async (
  username: string,
): Promise<DatabaseFriendRequest[] | { error: string }> => {
  try {
    // Find user by username
    const user: DatabaseUser | null = await UserModel.findOne({ username });

    if (!user) {
      return { error: 'User not found' };
    }

    // Get pending requests where user is the recipient
    const pendingRequests: DatabaseFriendRequest[] =
      await FriendRequestModel.find({
        recipient: user._id,
        status: 'pending',
      })
        .populate('requester', 'username')
        .populate('recipient', 'username')
        .sort({ requestedAt: -1 });

    return pendingRequests;
  } catch (error) {
    return { error: `Error occurred when getting pending requests: ${error}` };
  }
};

/**
 * Gets all friends of a user.
 *
 * @param {string} username - The username of the user.
 * @returns {Promise<{ _id: ObjectId; username: string; requestId: ObjectId }[] | { error: string }>} - All friends of the user or an error message.
 */
export const getFriendsByUsername = async (username: string): Promise<FriendConnectionResponse> => {
  try {
    const user: DatabaseUser | null = await UserModel.findOne({ username });

    if (!user) {
      return { error: 'User not found' };
    }

    const acceptedRequests: DatabaseFriendRequest[] = await FriendRequestModel.find({
      $or: [
        { requester: user._id, status: 'accepted' },
        { recipient: user._id, status: 'accepted' },
      ],
    })
      .populate('requester', 'username onlineStatus')
      .populate('recipient', 'username onlineStatus');

    const friends = acceptedRequests.map(request => {
      const isFriendRequester = String(request.recipient._id) === String(user._id);

      const friendUser = isFriendRequester ? request.requester : request.recipient;

      return {
        _id: friendUser._id,
        username: friendUser.username,
        requestId: request._id,
        onlineStatus: friendUser.onlineStatus,
      };
    });

    return friends;
  } catch (error) {
    return { error: `Error occurred when getting friends: ${error}` };
  }
};


/**
 * Deletes a friend request or friendship.
 *
 * @param {string} requestId - The ID of the friend request to delete.
 * @returns {Promise<DatabaseFriendRequest | { error: string }>} - The deleted friend request or an error message.
 */
export const deleteFriendRequest = async (
  requestId: string,
): Promise<DatabaseFriendRequest | { error: string }> => {
  try {
    // Get the request before deleting for returning it
    const friendRequest: DatabaseFriendRequest | null =
      await FriendRequestModel.findById(requestId)
        .populate('requester', 'username')
        .populate('recipient', 'username');

    if (!friendRequest) {
      return { error: 'Friend request not found' };
    }

    // Delete the request
    await FriendRequestModel.findByIdAndDelete(requestId);

    return friendRequest;
  } catch (error) {
    return { error: `Error occurred when deleting friend request: ${error}` };
  }
};

/**
 * Gets mutual friends between two users.
 *
 * @param {string} username1 - The username of the first user.
 * @param {string} username2 - The username of the second user.
 * @returns {Promise<SafeDatabaseUser[] | { error: string }>} - Mutual friends between the two users or an error message.
 */
export const getMutualFriends = async (
  username1: string,
  username2: string,
): Promise<SafeDatabaseUser[] | { error: string }> => {
  try {
    // Find users by usernames
    const user1: DatabaseUser | null = await UserModel.findOne({
      username: username1,
    });
    const user2: DatabaseUser | null = await UserModel.findOne({
      username: username2,
    });

    if (!user1 || !user2) {
      return { error: 'One or both users not found' };
    }

    // Get friends for user1
    const user1friends: DatabaseFriendRequest[] = await FriendRequestModel.find(
      {
        $or: [
          { requester: user1._id, status: 'accepted' },
          { recipient: user1._id, status: 'accepted' },
        ],
      },
    ).populate('requester recipient', 'username');

    const user1FriendIds = user1friends.map((friend) =>
      friend.requester._id.equals(user1._id)
        ? friend.recipient._id
        : friend.requester._id,
    );

    // Get friends for user2
    const user2friends: DatabaseFriendRequest[] = await FriendRequestModel.find(
      {
        $or: [
          { requester: user2._id, status: 'accepted' },
          { recipient: user2._id, status: 'accepted' },
        ],
      },
    ).populate('requester recipient', 'username');

    const user2FriendIds = user2friends.map((friend) =>
      friend.requester._id.equals(user2._id)
        ? friend.recipient._id
        : friend.requester._id,
    );

    // Find mutual friends by comparing the two friend lists
    const mutualFriendIds = user1FriendIds.filter((id1) =>
      user2FriendIds.some((id2) => id2.equals(id1)),
    );

    // Get user details for mutual friends
    const mutualFriends: SafeDatabaseUser[] = await UserModel.find({
      _id: { $in: mutualFriendIds },
    }).select('-password');

    return mutualFriends;
  } catch (error) {
    return { error: `Error occurred when getting mutual friends: ${error}` };
  }
};
