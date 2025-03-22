import { ObjectId } from 'mongodb';

/**
 * Represents a friend request document.
 * - `requester`: The user who sent the request.
 * - `recipient`: The user who received the request.
 * - `status`: The status of the friend request.
 * - `requestedAt`: The timestamp of the friend request.
 * - `updatedAt`: The timestamp of the last update to the request.
 */
export interface FriendRequest {
  requester: ObjectId;
  recipient: ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: Date;
  updatedAt: Date;
}

/**
 * Represents a friend request document as stored in the database.
 */
export interface DatabaseFriendRequest extends FriendRequest {
  _id: ObjectId;
}

/**
 * Represents a friend connection with minimal data and the associated request ID.
 * - `_id`: The unique identifier of the friend user.
 * - `username`: The username of the friend.
 * - `requestId`: The unique identifier of the friend request that established this friendship.
 */
export interface FriendConnection {
  _id: ObjectId;
  username: string;
  requestId: ObjectId;
}

/**
 * Represents the possible responses from friend-related operations.
 * - Either a `FriendConnection[]` array when successful
 * - Or an error object with an error message.
 */
export type FriendConnectionResponse = FriendConnection[] | { error: string };
