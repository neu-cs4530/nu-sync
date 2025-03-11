import React from 'react';
import './index.css';

// define interface for friends props
interface FriendCardProps {
  name: string;
  numFollowers: number;
  numMutualFriends: number;
}

/**
 * Component to display a singular friend for a user.
 * @returns A React component rendering:
 * - A friend card (a component to display a singular friend of the current user)
 * - Displays things such as the number of friends, number of mutual friends, etc.
 */
const FriendCard: React.FC<FriendCardProps> = ({ name, numFollowers, numMutualFriends }) => (
  <div className='friend-card'>
    <p>Name: {name}</p>
    <p>Number of Followers: {numFollowers}</p>
    <p>Number of Mutual Friends: {numMutualFriends}</p>
  </div>
);

export default FriendCard;
