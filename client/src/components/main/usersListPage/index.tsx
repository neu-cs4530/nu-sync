import React, { useState } from 'react';
import './index.css';
import { useNavigate } from 'react-router-dom';
import UserCardView from './userCard';
import useUserContext from '../../../hooks/useUserContext';
import useUsersListPage from '../../../hooks/useUsersListPage';
import { SafeDatabaseUser } from '../../../types/types';
import { isUserBlocked } from '../../../services/userService';

/**
 * Interface representing the props for the UsersListPage component.
 * handleUserSelect - The function to handle the click event on the user card.
 */
interface UserListPageProps {
  handleUserSelect?: (user: SafeDatabaseUser) => void;
}

/**
 * UsersListPage component renders a page displaying a list of users
 * based on search content filtering.
 * It includes a header with a search bar.
 */
const UsersListPage = (props: UserListPageProps) => {
  const { userList, setUserFilter } = useUsersListPage();
  const { user: currentUser } = useUserContext();
  const { handleUserSelect = null } = props;
  const navigate = useNavigate();
  const [showBlocked, setShowBlocked] = useState<boolean>(false);

  /**
   * Handles the click event on the user card.
   * If handleUserSelect is provided, it calls the handleUserSelect function.
   * Otherwise, it navigates to the user's profile page.
   */
  const handleUserCardViewClickHandler = (user: SafeDatabaseUser): void => {
    if (handleUserSelect) {
      handleUserSelect(user);
    } else if (user.username) {
      navigate(`/user/${user.username}`);
    }
  };

  /**
   * Handles the search input change.
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserFilter(e.target.value);
  };

  const displayUserList = userList.filter((user) => {
    // Always show the current user
    if (user.username === currentUser.username) return true;

    const userBlocked = isUserBlocked(currentUser, user.username);

    const isBlockedByUser =
      user.blockedUsers?.includes(currentUser.username) || false;
    return (showBlocked || !userBlocked) && !isBlockedByUser;
  });

  return (
    <div className="users-page-container">
      <div className="users-list-header">
        <div>
          <h2 className="users-list-title">Users</h2>
          {/* Change this to displayUserList.length */}
          <span className="users-count">
            {displayUserList.length} users found
          </span>
        </div>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search users..."
            onChange={handleSearchChange}
          />
          {/* Add the show blocked toggle */}
          <div className="show-blocked-toggle">
            <label htmlFor="show-blocked">
              <input
                type="checkbox"
                id="show-blocked"
                checked={showBlocked}
                onChange={() => setShowBlocked(!showBlocked)}
              />
              Show Blocked Users
            </label>
          </div>
        </div>
      </div>

      <div className="users-list">
        {/* Change this to map over displayUserList instead of userList */}
        {displayUserList.map((user) => (
          <UserCardView
            user={user}
            key={user.username}
            handleUserCardViewClickHandler={handleUserCardViewClickHandler}
          />
        ))}

        {/* Change this condition to check displayUserList */}
        {(!displayUserList || displayUserList.length === 0) && (
          <div className="empty-state">
            <p>No users found matching your search.</p>
            <p>Try a different search term or browse all users.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersListPage;
