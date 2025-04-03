import React, { useContext, useState, useRef, useEffect } from 'react';
import './index.css';
import { NavLink, useLocation } from 'react-router-dom';
import StatusPopup from '../statusPopup';
import UserContext from '../../../contexts/UserContext';
import useUserStatus from '../../../hooks/useUserStatus';

/**
 * The SideBarNav component has four menu items: "Questions", "Tags", "Messaging", and "Users".
 * It highlights the currently selected item based on the active page and
 * triggers corresponding functions when the menu items are clicked.
 */
const SideBarNav = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const context = useContext(UserContext);
  const username = context?.user?.username || '';

  const { status, busyScope, updateStatus, statusLabel, statusIcon } = useUserStatus();
  const location = useLocation();

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusPopup(false);
      }
    };

    if (showStatusPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusPopup]);

  const isActiveOption = (path: string) =>
    location.pathname === path ? 'message-option-selected' : '';

  const handleStatusSelect = async (
    newStatus: 'online' | 'away' | 'busy' | 'invisible',
    newBusyScope?: 'friends-only' | 'everyone',
  ) => {
    await updateStatus(newStatus, newBusyScope);
    setShowStatusPopup(false);
  };
  return (
    <div id='sideBarNav' className='sideBarNav'>
      <div className='nav-items'>
        <NavLink
          to='/home'
          id='menu_questions'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Questions
        </NavLink>
        <NavLink
          to='/tags'
          id='menu_tag'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Tags
        </NavLink>
        <NavLink
          to='/messaging'
          id='menu_messaging'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}
          onClick={toggleOptions}>
          Messaging
        </NavLink>
        {showOptions && (
          <div className='additional-options'>
            <NavLink
              to='/messaging'
              className={`menu_button message-options ${isActiveOption('/messaging')}`}>
              Global Messages
            </NavLink>
            <NavLink
              to='/messaging/direct-message'
              className={`menu_button message-options ${isActiveOption('/messaging/direct-message')}`}>
              Direct Messages
            </NavLink>
          </div>
        )}
        <NavLink
          to='/users'
          id='menu_users'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Users
        </NavLink>
        <NavLink
          to='/games'
          id='menu_games'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Games
        </NavLink>
        <NavLink
          to='/friends'
          id='menu_friends'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Friends
        </NavLink>
        <NavLink
          to='/requests'
          id='menu_requests'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Requests
        </NavLink>
      </div>
      <div className='status-wrapper' ref={statusRef}>
        <div className='status-row' onClick={() => setShowStatusPopup(!showStatusPopup)}>
          {statusIcon} {statusLabel}
        </div>
        {showStatusPopup && (
          <StatusPopup
            username={username}
            currentStatus={status}
            currentBusyScope={busyScope}
            onClose={() => setShowStatusPopup(false)}
            onSelect={handleStatusSelect}
          />
        )}
      </div>
    </div>
  );
};

export default SideBarNav;
