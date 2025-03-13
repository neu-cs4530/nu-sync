import React from 'react';
import FriendCard from './friendCard';
import './index.css';
/**
 * Component to display the list of friends for a user.
 * @returns A React component rendering:
 * - A list of friends for the current logged in user.
 */
const FriendsPage = () => {

  // list of dummy friends
  // TODO: change when friends functionality is implemented
  const dummyFriends = [
    { name: 'friend1', numFollowers: 124, numMutualFriends: 33 },
    { name: 'friend2', numFollowers: 452, numMutualFriends: 12 },
    { name: 'friend3', numFollowers: 983, numMutualFriends: 78 },
  ];

  return (
    <div className='friendsPage'>
      {dummyFriends.map((f, index) => (
        <FriendCard
          key={index}
          name={f.name}
          numFollowers={f.numFollowers}
          numMutualFriends={f.numMutualFriends}
        />
      ))}
    </div>
  );
};

export default FriendsPage;
