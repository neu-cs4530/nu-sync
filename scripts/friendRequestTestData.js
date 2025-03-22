// Use existing users from database
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Friend Request Schema
const friendRequestSchema = new Schema({
  requester: { type: String, required: true, ref: 'User' },
  recipient: { type: String, required: true, ref: 'User' },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  requestedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create indexes for efficient queries
friendRequestSchema.index({ requester: 1, status: 1 });
friendRequestSchema.index({ recipient: 1, status: 1 });

const FriendRequest = mongoose.model(
  'FriendRequest',
  friendRequestSchema,
  'FriendRequest',
);

// Function to generate test friend requests using existing users
async function createTestFriendRequests() {
  // Delete existing friend requests (for testing purposes)
  await FriendRequest.deleteMany({});

  // Sample friend requests - 5 accepted, 5 pending, 5 rejected
  const friendRequests = [
    // Accepted friend requests
    {
      requester: 'sana',
      recipient: 'ihba001',
      status: 'accepted',
      requestedAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-16'),
    },
    {
      requester: 'sana',
      recipient: 'saltyPeter',
      status: 'accepted',
      requestedAt: new Date('2023-01-20'),
      updatedAt: new Date('2023-01-21'),
    },
    {
      requester: 'hamkalo',
      recipient: 'alia',
      status: 'accepted',
      requestedAt: new Date('2023-01-10'),
      updatedAt: new Date('2023-01-12'),
    },
    {
      requester: 'azad',
      recipient: 'abhi3241',
      status: 'accepted',
      requestedAt: new Date('2023-01-05'),
      updatedAt: new Date('2023-01-06'),
    },
    {
      requester: 'Joji John',
      recipient: 'mackson3332',
      status: 'accepted',
      requestedAt: new Date('2023-01-25'),
      updatedAt: new Date('2023-01-26'),
    },

    // Pending friend requests
    {
      requester: 'saltyPeter',
      recipient: 'ihba001',
      status: 'pending',
      requestedAt: new Date('2023-02-01'),
      updatedAt: new Date('2023-02-01'),
    },
    {
      requester: 'monkeyABC',
      recipient: 'sana',
      status: 'pending',
      requestedAt: new Date('2023-02-03'),
      updatedAt: new Date('2023-02-03'),
    },
    {
      requester: 'abaya',
      recipient: 'alia',
      status: 'pending',
      requestedAt: new Date('2023-02-05'),
      updatedAt: new Date('2023-02-05'),
    },
    {
      requester: 'Joji John',
      recipient: 'abhi3241',
      status: 'pending',
      requestedAt: new Date('2023-02-10'),
      updatedAt: new Date('2023-02-10'),
    },
    {
      requester: 'hamkalo',
      recipient: 'mackson3332',
      status: 'pending',
      requestedAt: new Date('2023-02-12'),
      updatedAt: new Date('2023-02-12'),
    },

    // Rejected friend requests
    {
      requester: 'sana',
      recipient: 'azad',
      status: 'rejected',
      requestedAt: new Date('2023-01-30'),
      updatedAt: new Date('2023-01-31'),
    },
    {
      requester: 'monkeyABC',
      recipient: 'saltyPeter',
      status: 'rejected',
      requestedAt: new Date('2023-02-02'),
      updatedAt: new Date('2023-02-03'),
    },
    {
      requester: 'abaya',
      recipient: 'mackson3332',
      status: 'rejected',
      requestedAt: new Date('2023-02-04'),
      updatedAt: new Date('2023-02-05'),
    },
    {
      requester: 'alia',
      recipient: 'ihba001',
      status: 'rejected',
      requestedAt: new Date('2023-02-07'),
      updatedAt: new Date('2023-02-08'),
    },
    {
      requester: 'abhi3241',
      recipient: 'hamkalo',
      status: 'rejected',
      requestedAt: new Date('2023-02-09'),
      updatedAt: new Date('2023-02-10'),
    },
  ];

  return await FriendRequest.insertMany(friendRequests);
}

// Function to run the seed data creation
async function seedDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/fake_so', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to database');

    const requests = await createTestFriendRequests();
    console.log(`Created ${requests.length} test friend requests`);

    // Create some additional friend requests to demonstrate mutual friends
    await FriendRequest.insertMany([
      // Create some mutual friend requests for demonstration
      {
        requester: 'sana',
        recipient: 'abhi3241',
        status: 'accepted',
        requestedAt: new Date('2023-03-01'),
        updatedAt: new Date('2023-03-02'),
      },
      {
        requester: 'abhi3241',
        recipient: 'azad',
        status: 'accepted',
        requestedAt: new Date('2023-03-03'),
        updatedAt: new Date('2023-03-04'),
      },
      {
        requester: 'sana',
        recipient: 'azad',
        status: 'accepted', // Overrides previous rejected request
        requestedAt: new Date('2023-03-05'),
        updatedAt: new Date('2023-03-06'),
      },
    ]);

    // Query for mutual friends example - find mutual friends between sana and abhi3241
    const sanaFriends = await FriendRequest.find({
      $or: [
        { requester: 'sana', status: 'accepted' },
        { recipient: 'sana', status: 'accepted' },
      ],
    });

    const abhiFriends = await FriendRequest.find({
      $or: [
        { requester: 'abhi3241', status: 'accepted' },
        { recipient: 'abhi3241', status: 'accepted' },
      ],
    });

    // Extract friend usernames for both users
    const sanaFriendNames = sanaFriends.map((request) =>
      request.requester === 'sana' ? request.recipient : request.requester,
    );

    const abhiFriendNames = abhiFriends.map((request) =>
      request.requester === 'abhi3241' ? request.recipient : request.requester,
    );

    // Find mutual friends
    const mutualFriends = sanaFriendNames.filter((name) =>
      abhiFriendNames.includes(name),
    );

    console.log('Mutual friends between sana and abhi3241:', mutualFriends);

    mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

// Export the function for use in other files
module.exports = { seedDatabase };
