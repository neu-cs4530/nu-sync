import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../../../contexts/NotificationContext';
import useNotificationContext from '../../../hooks/useNotificationContext';
import './Notifications.css';

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
}) => {
  const { removeNotification } = useNotificationContext();
  const navigate = useNavigate();

  const { id, message, link } = notification;

  const handleClick = () => {
    navigate(link);
    removeNotification(id);
  };

  return (
    <div className="notification-item" onClick={handleClick}>
      <span className="notification-message">{message}</span>
      <button
        className="notification-close"
        onClick={(e) => {
          e.stopPropagation();
          removeNotification(id);
        }}
      >
        ×
      </button>
    </div>
  );
};

export default NotificationItem;
