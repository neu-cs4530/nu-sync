import Mongoose, { Model } from 'mongoose';
import { DatabaseFriendRequest } from '@fake-stack-overflow/shared/types/friend-request';
import friendRequestSchema from './schema/friend-request.schema';

/**
 * Mongoose model for the `FriendRequest` collection.
 *
 * This model is created using the `friendRequestSchema`, representing the `FriendRequest` collection in the MongoDB database,
 * and provides an interface for interacting with the stored friend request data.
 * @type {Model<DatabaseFriendRequest>}
 */
const FriendRequestModel: Model<DatabaseFriendRequest> =
  Mongoose.model<DatabaseFriendRequest>('FriendRequest', friendRequestSchema);

export default FriendRequestModel;
