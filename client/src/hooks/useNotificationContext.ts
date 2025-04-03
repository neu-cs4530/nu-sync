import { useContext } from 'react';
import NotificationContext, {
  NotificationContextType,
} from '../contexts/NotificationContext';

const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (context === null) {
    throw new Error(
      'useNotificationContext must be used within a NotificationContextProvider',
    );
  }

  return context;
};

export default useNotificationContext;
