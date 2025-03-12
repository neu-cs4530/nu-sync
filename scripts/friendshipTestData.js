// Use existing users from database
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Friend Relationship Schema
const friendshipSchema = new Schema({
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
  visibility: {
    type: String,
    enum: ['public', 'friends-only', 'private'],
    default: 'friends-only',
  },
  shareMusic: { type: Boolean, default: true },
  notificationsEnabled: { type: Boolean, default: true },
});

// Create indexes for efficient queries
friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });

const Friendship = mongoose.model('Friendship', friendshipSchema, 'Friendship');

// Function to generate test friendships using your existing users
async function createTestFriendships() {
  // Delete existing friendships (for testing purposes)
  await Friendship.deleteMany({});

  // Sample friendships - 5 accepted, 5 pending, 5 rejected
  const friendships = [
    // Accepted friendships
    {
      requester: 'sana',
      recipient: 'ihba001',
      status: 'accepted',
      requestedAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-16'),
      visibility: 'public',
      shareMusic: true,
      notificationsEnabled: true,
    },
    {
      requester: 'sana',
      recipient: 'saltyPeter',
      status: 'accepted',
      requestedAt: new Date('2023-01-20'),
      updatedAt: new Date('2023-01-21'),
      visibility: 'friends-only',
      shareMusic: true,
      notificationsEnabled: true,
    },
    {
      requester: 'hamkalo',
      recipient: 'alia',
      status: 'accepted',
      requestedAt: new Date('2023-01-10'),
      updatedAt: new Date('2023-01-12'),
      visibility: 'friends-only',
      shareMusic: false,
      notificationsEnabled: true,
    },
    {
      requester: 'azad',
      recipient: 'abhi3241',
      status: 'accepted',
      requestedAt: new Date('2023-01-05'),
      updatedAt: new Date('2023-01-06'),
      visibility: 'private',
      shareMusic: true,
      notificationsEnabled: false,
    },
    {
      requester: 'Joji John',
      recipient: 'mackson3332',
      status: 'accepted',
      requestedAt: new Date('2023-01-25'),
      updatedAt: new Date('2023-01-26'),
      visibility: 'public',
      shareMusic: true,
      notificationsEnabled: true,
    },

    // Pending friendships
    {
      requester: 'saltyPeter',
      recipient: 'ihba001',
      status: 'pending',
      requestedAt: new Date('2023-02-01'),
      updatedAt: new Date('2023-02-01'),
      visibility: 'friends-only',
      shareMusic: true,
      notificationsEnabled: true,
    },
    {
      requester: 'monkeyABC',
      recipient: 'sana',
      status: 'pending',
      requestedAt: new Date('2023-02-03'),
      updatedAt: new Date('2023-02-03'),
      visibility: 'friends-only',
      shareMusic: true,
      notificationsEnabled: true,
    },
    {
      requester: 'abaya',
      recipient: 'alia',
      status: 'pending',
      requestedAt: new Date('2023-02-05'),
      updatedAt: new Date('2023-02-05'),
      visibility: 'public',
      shareMusic: true,
      notificationsEnabled: true,
    },
    {
      requester: 'Joji John',
      recipient: 'abhi3241',
      status: 'pending',
      requestedAt: new Date('2023-02-10'),
      updatedAt: new Date('2023-02-10'),
      visibility: 'private',
      shareMusic: false,
      notificationsEnabled: true,
    },
    {
      requester: 'hamkalo',
      recipient: 'mackson3332',
      status: 'pending',
      requestedAt: new Date('2023-02-12'),
      updatedAt: new Date('2023-02-12'),
      visibility: 'friends-only',
      shareMusic: true,
      notificationsEnabled: true,
    },

    // Rejected friendships
    {
      requester: 'sana',
      recipient: 'azad',
      status: 'rejected',
      requestedAt: new Date('2023-01-30'),
      updatedAt: new Date('2023-01-31'),
      visibility: 'friends-only',
      shareMusic: true,
      notificationsEnabled: false,
    },
    {
      requester: 'monkeyABC',
      recipient: 'saltyPeter',
      status: 'rejected',
      requestedAt: new Date('2023-02-02'),
      updatedAt: new Date('2023-02-03'),
      visibility: 'public',
      shareMusic: true,
      notificationsEnabled: true,
    },
    {
      requester: 'abaya',
      recipient: 'mackson3332',
      status: 'rejected',
      requestedAt: new Date('2023-02-04'),
      updatedAt: new Date('2023-02-05'),
      visibility: 'private',
      shareMusic: false,
      notificationsEnabled: false,
    },
    {
      requester: 'alia',
      recipient: 'ihba001',
      status: 'rejected',
      requestedAt: new Date('2023-02-07'),
      updatedAt: new Date('2023-02-08'),
      visibility: 'friends-only',
      shareMusic: true,
      notificationsEnabled: true,
    },
    {
      requester: 'abhi3241',
      recipient: 'hamkalo',
      status: 'rejected',
      requestedAt: new Date('2023-02-09'),
      updatedAt: new Date('2023-02-10'),
      visibility: 'public',
      shareMusic: true,
      notificationsEnabled: true,
    },
  ];

  return await Friendship.insertMany(friendships);
}

// Function to run the seed data creation
async function seedDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/fake_so', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to database');

    const friendships = await createTestFriendships();
    console.log(`Created ${friendships.length} test friendships`);

    // Create some additional friendships to demonstrate mutual friends
    await Friendship.insertMany([
      // Create some mutual friendships for demonstration
      {
        requester: 'sana',
        recipient: 'abhi3241',
        status: 'accepted',
        requestedAt: new Date('2023-03-01'),
        updatedAt: new Date('2023-03-02'),
        visibility: 'public',
        shareMusic: true,
        notificationsEnabled: true,
      },
      {
        requester: 'abhi3241',
        recipient: 'azad',
        status: 'accepted',
        requestedAt: new Date('2023-03-03'),
        updatedAt: new Date('2023-03-04'),
        visibility: 'public',
        shareMusic: true,
        notificationsEnabled: true,
      },
      {
        requester: 'sana',
        recipient: 'azad',
        status: 'accepted', // Overrides previous rejected request
        requestedAt: new Date('2023-03-05'),
        updatedAt: new Date('2023-03-06'),
        visibility: 'public',
        shareMusic: true,
        notificationsEnabled: true,
      },
    ]);

    // Query for mutual friends example - find mutual friends between sana and abhi3241
    const sanaFriends = await Friendship.find({
      $or: [
        { requester: 'sana', status: 'accepted' },
        { recipient: 'sana', status: 'accepted' },
      ],
    });

    const abhiFriends = await Friendship.find({
      $or: [
        { requester: 'abhi3241', status: 'accepted' },
        { recipient: 'abhi3241', status: 'accepted' },
      ],
    });

    // Extract friend usernames for both users
    const sanaFriendNames = sanaFriends.map((friendship) =>
      friendship.requester === 'sana'
        ? friendship.recipient
        : friendship.requester,
    );

    const abhiFriendNames = abhiFriends.map((friendship) =>
      friendship.requester === 'abhi3241'
        ? friendship.recipient
        : friendship.requester,
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
