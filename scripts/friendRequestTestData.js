const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string
const uri = 'mongodb://localhost:27017';
const dbName = 'fake_so';

async function createTestFriendRequests() {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to database');

    const db = client.db(dbName);

    // Get all users
    const users = await db
      .collection('User')
      .find({
        username: {
          $in: [
            'sana',
            'ihba001',
            'saltyPeter',
            'hamkalo',
            'alia',
            'azad',
            'abhi3241',
            'Joji John',
            'mackson3332',
            'monkeyABC',
            'abaya',
          ],
        },
      })
      .toArray();

    console.log(`Found ${users.length} users in the database`);

    // Create a map of usernames to their ObjectIds
    const userMap = {};
    users.forEach((user) => {
      userMap[user.username] = user._id;
    });

    console.log('Username to ID map created');

    // Delete existing friend requests
    const deleteResult = await db.collection('FriendRequest').deleteMany({});
    console.log(
      `Deleted ${deleteResult.deletedCount} existing friend requests`,
    );

    // Prepare friend requests with ObjectIds
    const friendRequests = [
      // ACCEPTED FRIEND REQUESTS (10)
      {
        requester: userMap['sana'],
        recipient: userMap['ihba001'],
        status: 'accepted',
        requestedAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-01-16'),
      },
      {
        requester: userMap['sana'],
        recipient: userMap['saltyPeter'],
        status: 'accepted',
        requestedAt: new Date('2023-01-20'),
        updatedAt: new Date('2023-01-21'),
      },
      {
        requester: userMap['hamkalo'] || userMap['sana'],
        recipient: userMap['alia'] || userMap['ihba001'],
        status: 'accepted',
        requestedAt: new Date('2023-01-10'),
        updatedAt: new Date('2023-01-12'),
      },
      {
        requester: userMap['azad'] || userMap['sana'],
        recipient: userMap['abhi3241'] || userMap['ihba001'],
        status: 'accepted',
        requestedAt: new Date('2023-01-05'),
        updatedAt: new Date('2023-01-06'),
      },
      {
        requester: userMap['abhi3241'] || userMap['sana'],
        recipient: userMap['azad'] || userMap['ihba001'],
        status: 'accepted',
        requestedAt: new Date('2023-03-03'),
        updatedAt: new Date('2023-03-04'),
      },
      {
        requester: userMap['sana'],
        recipient: userMap['azad'] || userMap['ihba001'],
        status: 'accepted',
        requestedAt: new Date('2023-03-05'),
        updatedAt: new Date('2023-03-06'),
      },
      {
        requester: userMap['sana'],
        recipient: userMap['abhi3241'] || userMap['ihba001'],
        status: 'accepted',
        requestedAt: new Date('2023-03-01'),
        updatedAt: new Date('2023-03-02'),
      },
      {
        requester: userMap['ihba001'],
        recipient: userMap['abhi3241'] || userMap['azad'],
        status: 'accepted',
        requestedAt: new Date('2023-04-10'),
        updatedAt: new Date('2023-04-12'),
      },
      {
        requester: userMap['ihba001'],
        recipient: userMap['saltyPeter'] || userMap['azad'],
        status: 'accepted',
        requestedAt: new Date('2023-04-15'),
        updatedAt: new Date('2023-04-17'),
      },
      {
        requester: userMap['saltyPeter'] || userMap['azad'],
        recipient: userMap['abhi3241'] || userMap['monkeyABC'],
        status: 'accepted',
        requestedAt: new Date('2023-04-20'),
        updatedAt: new Date('2023-04-21'),
      },

      // PENDING FRIEND REQUESTS (15)
      {
        requester: userMap['saltyPeter'] || userMap['sana'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-02-01'),
        updatedAt: new Date('2023-02-01'),
      },
      {
        requester: userMap['monkeyABC'] || userMap['abhi3241'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-02-03'),
        updatedAt: new Date('2023-02-03'),
      },
      {
        requester: userMap['abaya'] || userMap['azad'],
        recipient: userMap['alia'] || userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-02-05'),
        updatedAt: new Date('2023-02-05'),
      },
      {
        requester: userMap['abhi3241'] || userMap['monkeyABC'],
        recipient: userMap['saltyPeter'] || userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-05-01'),
        updatedAt: new Date('2023-05-01'),
      },
      {
        requester: userMap['azad'] || userMap['abhi3241'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-05-03'),
        updatedAt: new Date('2023-05-03'),
      },
      {
        requester: userMap['alia'] || userMap['azad'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-05-05'),
        updatedAt: new Date('2023-05-05'),
      },
      {
        requester: userMap['hamkalo'] || userMap['azad'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-05-07'),
        updatedAt: new Date('2023-05-07'),
      },
      {
        requester: userMap['Joji John'] || userMap['monkeyABC'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-05-09'),
        updatedAt: new Date('2023-05-09'),
      },
      {
        requester: userMap['mackson3332'] || userMap['abhi3241'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-05-11'),
        updatedAt: new Date('2023-05-11'),
      },
      {
        requester: userMap['monkeyABC'] || userMap['azad'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-05-13'),
        updatedAt: new Date('2023-05-13'),
      },
      {
        requester: userMap['abhi3241'] || userMap['azad'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-05-15'),
        updatedAt: new Date('2023-05-15'),
      },
      {
        requester: userMap['azad'] || userMap['monkeyABC'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-05-17'),
        updatedAt: new Date('2023-05-17'),
      },
      {
        requester: userMap['alia'] || userMap['abhi3241'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-05-19'),
        updatedAt: new Date('2023-05-19'),
      },
      {
        requester: userMap['hamkalo'] || userMap['azad'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-05-21'),
        updatedAt: new Date('2023-05-21'),
      },
      {
        requester: userMap['Joji John'] || userMap['monkeyABC'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-05-23'),
        updatedAt: new Date('2023-05-23'),
      },

      // REJECTED FRIEND REQUESTS (5)
      {
        requester: userMap['sana'],
        recipient: userMap['monkeyABC'] || userMap['abhi3241'],
        status: 'rejected',
        requestedAt: new Date('2023-01-30'),
        updatedAt: new Date('2023-01-31'),
      },
      {
        requester: userMap['monkeyABC'] || userMap['azad'],
        recipient: userMap['saltyPeter'] || userMap['ihba001'],
        status: 'rejected',
        requestedAt: new Date('2023-02-02'),
        updatedAt: new Date('2023-02-03'),
      },
      {
        requester: userMap['abaya'] || userMap['azad'],
        recipient: userMap['mackson3332'] || userMap['ihba001'],
        status: 'rejected',
        requestedAt: new Date('2023-02-04'),
        updatedAt: new Date('2023-02-05'),
      },
      {
        requester: userMap['alia'] || userMap['azad'],
        recipient: userMap['ihba001'],
        status: 'rejected',
        requestedAt: new Date('2023-02-07'),
        updatedAt: new Date('2023-02-08'),
      },
      {
        requester: userMap['abhi3241'] || userMap['sana'],
        recipient: userMap['hamkalo'] || userMap['azad'],
        status: 'rejected',
        requestedAt: new Date('2023-02-09'),
        updatedAt: new Date('2023-02-10'),
      },
    ];

    // Filter out any request with undefined users
    const validRequests = friendRequests.filter(
      (req) =>
        req.requester && req.recipient && !req.requester.equals(req.recipient),
    );

    // Insert the friend requests
    const insertResult = await db
      .collection('FriendRequest')
      .insertMany(validRequests);
    console.log(`Created ${insertResult.insertedCount} test friend requests`);
    console.log(
      `- ${validRequests.filter((r) => r.status === 'accepted').length} accepted requests`,
    );
    console.log(
      `- ${validRequests.filter((r) => r.status === 'pending').length} pending requests`,
    );
    console.log(
      `- ${validRequests.filter((r) => r.status === 'rejected').length} rejected requests`,
    );

    return true;
  } catch (error) {
    console.error('Error creating test data:', error);
    return false;
  } finally {
    await client.close();
    console.log('Disconnected from database');
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  createTestFriendRequests()
    .then((success) => {
      if (success) {
        console.log('Test data creation completed successfully');
      } else {
        console.error('Test data creation failed');
      }
    })
    .catch((err) => {
      console.error('Unhandled error:', err);
    });
}

// Export the function for use in other files
module.exports = { createTestFriendRequests };
