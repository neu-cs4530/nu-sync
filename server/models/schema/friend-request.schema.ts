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
  },
  { collection: 'FriendRequest', timestamps: true },
);

export default friendRequestSchema;
