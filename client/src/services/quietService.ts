import { SafeDatabaseUser } from '../types/types';
import api from './config';

const USER_API_URL = `${process.env.REACT_APP_SERVER_URL}/quiet`;

/**
 * Sets or clears a user's quiet hours.
 * @param username - The user's username
 * @param quietHours - Optional object with start/end ("HH:mm"). If omitted, quiet hours are cleared.
 */
const updateQuietHours = async (
  username: string,
  quietHours?: { start: string; end: string },
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateQuietHours`, {
    username,
    ...(quietHours ? { quietHours } : {}),
  });

  if (res.status !== 200) {
    throw new Error('Error when updating quiet hours');
  }

  return res.data.user;
};

export default updateQuietHours;
