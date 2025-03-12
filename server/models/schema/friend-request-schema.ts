import { Schema, Types } from 'mongoose';

/**
 * Mongoose schema for the FriendRequest collection.
 *
 * This schema defines the structure for storing friend requests in the database.
 * Each friend request includes:
 * - `requester`: The user who sent the request.
 * - `recipient`: The user who received the request.
 * - `status`: The status of the request (pending, accepted, rejected).
 * - `requestedAt`: The date and time when the request was made.
 * - `updatedAt`: The date and time when the request status was last updated.
 * - `privacySettings`: Controls various privacy options between the two users.
 */
const friendRequestSchema: Schema = new Schema(
  {
    requester: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
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
        enum: ['public', 'friends-only', 'private'],
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
  { collection: 'FriendRequest', timestamps: true },
);

export default friendRequestSchema;
