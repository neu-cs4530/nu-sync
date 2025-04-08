import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import StatusPopup from '../statusPopup';
import useUserStatus from '../../../hooks/useUserStatus';
import useUserContext from '../../../hooks/useUserContext';

/**
 * Sidebar navigation component with status indicator matching the profile style.
 */
const SideBarNav = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const { user } = useUserContext();
  const { updateStatus } = useUserStatus();
  const location = useLocation();

  const isMessagingParentActive = location.pathname === '/messaging';
  const isDirectMessageActive =
    location.pathname === '/messaging/direct-message';

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
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

  const handleStatusSelect = async (
    newStatus: 'online' | 'away' | 'busy' | 'invisible',
    newBusyScope?: 'friends-only' | 'everyone',
  ) => {
    await updateStatus(newStatus, newBusyScope);
    setShowStatusPopup(false);
  };

  // Function to get status color
  const getStatusColor = (status: unknown) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'invisible':
        return 'bg-gray-400';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="h-full w-56 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Main navigation */}
      <div className="flex-1 px-2 py-4">
        <NavLink
          to="/home"
          className={({ isActive }) => `
            flex items-center px-3 py-2 mb-2 rounded text-sm font-medium
            ${
              isActive
                ? 'bg-[#4361ee] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          Questions
        </NavLink>

        <NavLink
          to="/tags"
          className={({ isActive }) => `
            flex items-center px-3 py-2 mb-2 rounded text-sm font-medium
            ${
              isActive
                ? 'bg-[#4361ee] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          Tags
        </NavLink>

        <div
          className={`
        flex items-center px-3 py-2 rounded text-sm font-medium
        ${
          isMessagingParentActive || isDirectMessageActive
            ? 'bg-[#4361ee] text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
        }
      `}
          onClick={toggleOptions}
        >
          Messaging
        </div>

        {showOptions && (
          <div className="ml-4 mt-1 flex flex-col space-y-1">
            <NavLink
              to="/messaging"
              className={`
            flex items-center px-2 py-1.5 rounded text-sm
            ${
              isMessagingParentActive && !isDirectMessageActive
                ? 'bg-[#4361ee] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }
          `}
            >
              Global Messages
            </NavLink>

            <NavLink
              to="/messaging/direct-message"
              className={`
            flex items-center px-2 py-1.5 rounded text-sm
            ${
              isDirectMessageActive
                ? 'bg-[#4361ee] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }
          `}
            >
              Direct Messages
            </NavLink>
          </div>
        )}

        <NavLink
          to="/users"
          className={({ isActive }) => `
            flex items-center px-3 py-2 mb-2 rounded text-sm font-medium
            ${
              isActive
                ? 'bg-[#4361ee] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          Users
        </NavLink>

        <NavLink
          to="/games"
          className={({ isActive }) => `
            flex items-center px-3 py-2 mb-2 rounded text-sm font-medium
            ${
              isActive
                ? 'bg-[#4361ee] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          Games
        </NavLink>

        <NavLink
          to="/friends"
          className={({ isActive }) => `
            flex items-center px-3 py-2 mb-2 rounded text-sm font-medium
            ${
              isActive
                ? 'bg-[#4361ee] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          Friends
        </NavLink>

        <NavLink
          to="/requests"
          className={({ isActive }) => `
            flex items-center px-3 py-2 mb-2 rounded text-sm font-medium
            ${
              isActive
                ? 'bg-[#4361ee] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          Requests
        </NavLink>
      </div>

      {/* User status section at bottom */}
      <div className="p-3 border-t border-gray-200" ref={statusRef}>
        <div
          className="flex items-center px-3 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => setShowStatusPopup(!showStatusPopup)}
        >
          {/* Profile-style status indicator */}
          <div className="flex items-center">
            <span className="mr-2">{user.username || 'Online'}</span>
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(user.onlineStatus?.status || 'online')}`}
            ></div>
          </div>
        </div>

        {showStatusPopup && (
          <StatusPopup
            username={user.username}
            currentStatus={user.onlineStatus?.status || 'online'}
            currentBusyScope={user.onlineStatus?.busySettings?.muteScope}
            onClose={() => setShowStatusPopup(false)}
            onSelect={handleStatusSelect}
          />
        )}
      </div>
    </div>
  );
};

export default SideBarNav;
