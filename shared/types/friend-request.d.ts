import { ObjectId } from 'mongodb';

/**
 * Represents a user entity with basic identification information.
 * - `_id`: The unique MongoDB identifier for the user.
 * - `username`: The user's display name in the system.
 */
export interface FriendUser {
  _id: ObjectId;
  username: string;
  onlineStatus?: {
    status: 'online' | 'away' | 'busy' | 'invisible';
    busySettings?: {
      muteScope: 'friends-only' | 'everyone';
    };
  };
}

/**
 * Represents a friend request entity in the database.
 * @interface DatabaseFriendRequest
 *
 * @property {ObjectId} _id - The unique MongoDB identifier for the friend request.
 * @property {User} requester - The user who initiated the friend request.
 * @property {User} recipient - The user who received the friend request.
 * @property {'pending' | 'accepted' | 'rejected'} status - The current status of the friend request.
 * @property {Date} requestedAt - The timestamp when the friend request was created.
 * @property {Date} updatedAt - The timestamp when the friend request was last updated.
 */
export interface DatabaseFriendRequest {
  _id: ObjectId;
  requester: FriendUser;
  recipient: FriendUser;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: Date;
  updatedAt: Date;
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
  onlineStatus?: {
    status: 'online' | 'away' | 'busy' | 'invisible';
    busySettings?: {
      muteScope: 'friends-only' | 'everyone';
    };
  };
}

/**
 * Represents the possible responses from friend-related operations.
 * - Either a `FriendConnection[]` array when successful
 * - Or an error object with an error message.
 */
export type FriendConnectionResponse = FriendConnection[] | { error: string };
