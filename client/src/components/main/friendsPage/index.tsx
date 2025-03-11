import React from 'react';
import './index.css';
/**
 * Component to display the list of friends for a user.
 * @returns A React component rendering:
 * - A list of friends for the current logged in user.
 */
const FriendsPage = () => {
    const dummyFriends = ['friend1', 'friend2', 'friend3']

    return (
        <div className='friendsPage'>
            {dummyFriends.map((f) => {
                return <li>{f}</li>
            })}
        </div>
    )
};

export default FriendsPage;
