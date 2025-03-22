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
