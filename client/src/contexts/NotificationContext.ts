import { createContext } from 'react';

/**
 * Interface representing a notification object.
 *
 * - `id`: Unique identifier for the notification
 * - `message`: The notification content to display
 * - `link`: URL to navigate to when the notification is clicked
 */
export interface Notification {
  id: string;
  message: string;
  link: string;
}

/**
 * Interface representing the context type for notification management.
 *
 * - `notifications`: An array of active notifications
 * - `addNotification`: Function to add a new notification
 * - `removeNotification`: Function to remove a notification by ID
 */
export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export default NotificationContext;
