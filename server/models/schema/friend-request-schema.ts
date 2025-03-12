import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Friendships collection.
 *
 * This schema defines the structure for storing friend requests and relationships in the database.
 * Each document includes the following fields:
 * - `requester`: The ObjectId of the user who sent the friend request.
 * - `recipient`: The ObjectId of the user who received the friend request.
 * - `status`: The status of the friend request (e.g., "pending", "accepted", "rejected").
 * - `requestedAt`: The timestamp when the request was sent.
 * - `updatedAt`: The timestamp when the request was last updated.
 * - `privacySettings`: Privacy settings specific to this friendship.
 */
const friendRequestSchema: Schema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User', // References the User collection
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User', // References the User collection
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'], // Allowed statuses
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    privacySettings: {
      visibility: {
        type: String,
        enum: ['public', 'friends-only', 'private'], // Allowed visibility options
        default: 'friends-only',
      },
      shareMusic: {
        type: Boolean,
        default: true,
      },
      allowChat: {
        type: Boolean,
        default: true,
      },
      allowCodeSharing: {
        type: Boolean,
        default: true,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  { collection: 'Friendships' },
);

export default friendRequestSchema;