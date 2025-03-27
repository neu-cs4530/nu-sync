const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string
const uri = 'mongodb://localhost:27017';
const dbName = 'fake_so';

async function updateDatabase() {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to database');

    const db = client.db(dbName);

    // Get all users to create a username to ObjectId mapping
    const users = await db.collection('User').find({}).toArray();
    console.log(`Found ${users.length} users in the database`);

    // Create a map of usernames to their ObjectIds
    const usernameToIdMap = {};
    users.forEach((user) => {
      usernameToIdMap[user.username] = user._id;
    });

    console.log('Username to ID map created');

    // Get all friend requests
    const requests = await db.collection('FriendRequest').find({}).toArray();
    console.log(`Found ${requests.length} friend requests to update`);

    // Update each request
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const request of requests) {
      try {
        let needsUpdate = false;
        const updates = {};

        // Check if requester is a string
        if (typeof request.requester === 'string') {
          const requesterUsername = request.requester;
          const requesterId = usernameToIdMap[requesterUsername];

          if (!requesterId) {
            console.error(
              `No user found for requester: "${requesterUsername}"`,
            );
            errorCount++;
            continue;
          }

          updates.requester = requesterId;
          needsUpdate = true;
        }

        // Check if recipient is a string
        if (typeof request.recipient === 'string') {
          const recipientUsername = request.recipient;
          const recipientId = usernameToIdMap[recipientUsername];

          if (!recipientId) {
            console.error(
              `No user found for recipient: "${recipientUsername}"`,
            );
            errorCount++;
            continue;
          }

          updates.recipient = recipientId;
          needsUpdate = true;
        }

        // Only update if we need to
        if (needsUpdate) {
          const result = await db
            .collection('FriendRequest')
            .updateOne({ _id: request._id }, { $set: updates });

          if (result.modifiedCount === 1) {
            updatedCount++;
            console.log(`Updated request ${request._id}`);
          } else {
            errorCount++;
            console.error(`Failed to update request ${request._id}`);
          }
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(
          `Error updating request ${request._id}: ${error.message}`,
        );
        errorCount++;
      }
    }

    console.log(
      `\nUpdate complete: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`,
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('Disconnected from database');
  }
}

updateDatabase();
