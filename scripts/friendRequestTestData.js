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

    // Track relationships to avoid duplicates
    const relationships = new Set();

    // Helper function to add relationship to tracking set
    const addRelationship = (user1, user2) => {
      const pair = [user1.toString(), user2.toString()].sort().join('-');
      relationships.add(pair);
      return pair;
    };

    // Helper function to check if relationship already exists
    const hasRelationship = (user1, user2) => {
      const pair = [user1.toString(), user2.toString()].sort().join('-');
      return relationships.has(pair);
    };

    // ACCEPTED FRIEND REQUESTS (10)
    const acceptedRequests = [
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
        requester: userMap['hamkalo'],
        recipient: userMap['alia'],
        status: 'accepted',
        requestedAt: new Date('2023-01-10'),
        updatedAt: new Date('2023-01-12'),
      },
      {
        requester: userMap['azad'],
        recipient: userMap['abhi3241'],
        status: 'accepted',
        requestedAt: new Date('2023-01-05'),
        updatedAt: new Date('2023-01-06'),
      },
      {
        requester: userMap['sana'],
        recipient: userMap['azad'],
        status: 'accepted',
        requestedAt: new Date('2023-03-05'),
        updatedAt: new Date('2023-03-06'),
      },
      {
        requester: userMap['ihba001'],
        recipient: userMap['azad'],
        status: 'accepted',
        requestedAt: new Date('2023-04-10'),
        updatedAt: new Date('2023-04-12'),
      },
      {
        requester: userMap['ihba001'],
        recipient: userMap['alia'],
        status: 'accepted',
        requestedAt: new Date('2023-04-15'),
        updatedAt: new Date('2023-04-17'),
      },
      {
        requester: userMap['saltyPeter'],
        recipient: userMap['monkeyABC'],
        status: 'accepted',
        requestedAt: new Date('2023-04-20'),
        updatedAt: new Date('2023-04-21'),
      },
      {
        requester: userMap['hamkalo'],
        recipient: userMap['monkeyABC'],
        status: 'accepted',
        requestedAt: new Date('2023-05-25'),
        updatedAt: new Date('2023-05-26'),
      },
      {
        requester: userMap['abaya'],
        recipient: userMap['mackson3332'],
        status: 'accepted',
        requestedAt: new Date('2023-06-01'),
        updatedAt: new Date('2023-06-02'),
      },
    ];

    // Add all accepted relationships to the tracking set
    acceptedRequests.forEach((req) => {
      if (req.requester && req.recipient) {
        addRelationship(req.requester, req.recipient);
      }
    });

    // PENDING FRIEND REQUESTS (15)
    // Define a larger pool of potential pending requests
    const potentialPendingRequests = [
      // Users sending requests to sana
      {
        requester: userMap['monkeyABC'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-02-03'),
        updatedAt: new Date('2023-02-03'),
      },
      {
        requester: userMap['Joji John'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-05-09'),
        updatedAt: new Date('2023-05-09'),
      },
      {
        requester: userMap['mackson3332'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-05-11'),
        updatedAt: new Date('2023-05-11'),
      },
      {
        requester: userMap['abaya'],
        recipient: userMap['sana'],
        status: 'pending',
        requestedAt: new Date('2023-05-15'),
        updatedAt: new Date('2023-05-15'),
      },
      // Users sending requests to ihba001
      {
        requester: userMap['monkeyABC'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-05-13'),
        updatedAt: new Date('2023-05-13'),
      },
      {
        requester: userMap['hamkalo'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-05-21'),
        updatedAt: new Date('2023-05-21'),
      },
      {
        requester: userMap['Joji John'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-05-23'),
        updatedAt: new Date('2023-05-23'),
      },
      {
        requester: userMap['mackson3332'],
        recipient: userMap['ihba001'],
        status: 'pending',
        requestedAt: new Date('2023-06-05'),
        updatedAt: new Date('2023-06-05'),
      },
      // Various other pending requests
      {
        requester: userMap['abaya'],
        recipient: userMap['saltyPeter'],
        status: 'pending',
        requestedAt: new Date('2023-02-05'),
        updatedAt: new Date('2023-02-05'),
      },
      {
        requester: userMap['abhi3241'],
        recipient: userMap['monkeyABC'],
        status: 'pending',
        requestedAt: new Date('2023-05-01'),
        updatedAt: new Date('2023-05-01'),
      },
      {
        requester: userMap['abhi3241'],
        recipient: userMap['hamkalo'],
        status: 'pending',
        requestedAt: new Date('2023-05-03'),
        updatedAt: new Date('2023-05-03'),
      },
      {
        requester: userMap['alia'],
        recipient: userMap['mackson3332'],
        status: 'pending',
        requestedAt: new Date('2023-05-05'),
        updatedAt: new Date('2023-05-05'),
      },
      {
        requester: userMap['azad'],
        recipient: userMap['Joji John'],
        status: 'pending',
        requestedAt: new Date('2023-05-07'),
        updatedAt: new Date('2023-05-07'),
      },
      {
        requester: userMap['saltyPeter'],
        recipient: userMap['abaya'],
        status: 'pending',
        requestedAt: new Date('2023-05-17'),
        updatedAt: new Date('2023-05-17'),
      },
      {
        requester: userMap['alia'],
        recipient: userMap['abaya'],
        status: 'pending',
        requestedAt: new Date('2023-05-19'),
        updatedAt: new Date('2023-05-19'),
      },
      {
        requester: userMap['Joji John'],
        recipient: userMap['mackson3332'],
        status: 'pending',
        requestedAt: new Date('2023-05-25'),
        updatedAt: new Date('2023-05-25'),
      },
      {
        requester: userMap['monkeyABC'],
        recipient: userMap['abhi3241'],
        status: 'pending',
        requestedAt: new Date('2023-06-01'),
        updatedAt: new Date('2023-06-01'),
      },
    ];

    // Filter out pending requests where an accepted relationship already exists
    const pendingRequests = potentialPendingRequests
      .filter((req) => {
        if (
          !req.requester ||
          !req.recipient ||
          req.requester.equals(req.recipient)
        ) {
          return false;
        }
        return !hasRelationship(req.requester, req.recipient);
      })
      .slice(0, 15); // Take the first 15 valid ones

    // Combine the accepted and pending requests
    const allRequests = [...acceptedRequests, ...pendingRequests];

    // Filter out any request with undefined users or self-requests
    const validRequests = allRequests.filter(
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
