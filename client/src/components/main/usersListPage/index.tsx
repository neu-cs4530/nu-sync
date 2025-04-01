import React from 'react';
import './index.css';
import { useNavigate } from 'react-router-dom';
import UserCardView from './userCard';
import useUsersListPage from '../../../hooks/useUsersListPage';
import { SafeDatabaseUser } from '../../../types/types';

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
  const { handleUserSelect = null } = props;
  const navigate = useNavigate();

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

  return (
    <div className="users-page-container">
      <div className="users-list-header">
        <div>
          <h2 className="users-list-title">Users</h2>
          <span className="users-count">{userList.length} users found</span>
        </div>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search users..."
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="users-list">
        {userList.map((user) => (
          <UserCardView
            user={user}
            key={user.username}
            handleUserCardViewClickHandler={handleUserCardViewClickHandler}
          />
        ))}

        {(!userList || userList.length === 0) && (
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
