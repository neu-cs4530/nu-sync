import React from 'react';
import useNotificationContext from '../../../hooks/useNotificationContext';
import NotificationItem from './NotificationItem';
import './Notifications.css';

const NotificationContainer: React.FC = () => {
  const { notifications } = useNotificationContext();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default NotificationContainer;
