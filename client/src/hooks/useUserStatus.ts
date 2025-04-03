import { useState, useMemo } from 'react';
import { setUserStatus } from '../services/userService';
import useUserContext from './useUserContext';

type Status = 'online' | 'away' | 'busy' | 'invisible';
type BusyScope = 'friends-only' | 'everyone';

const useUserStatus = () => {
  const { user } = useUserContext();
  const [status, setStatus] = useState<Status>(user.onlineStatus?.status ?? 'online');
  const [busyScope, setBusyScope] = useState<BusyScope>(
    user.onlineStatus?.busySettings?.muteScope ?? 'everyone',
  );

  const updateStatus = async (newStatus: Status, newBusyScope?: BusyScope) => {
    await setUserStatus(
      user.username,
      newStatus,
      newStatus === 'busy' ? { muteScope: newBusyScope ?? 'everyone' } : undefined,
    );

    setStatus(newStatus);
    if (newStatus === 'busy') {
      setBusyScope(newBusyScope ?? 'everyone');
    }
  };

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Idle';
      case 'busy':
        return 'Do Not Disturb';
      case 'invisible':
        return 'Invisible';
      default:
        return '';
    }
  }, [status]);

  const statusIcon = useMemo(() => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'away':
        return '🌙';
      case 'busy':
        return '⛔';
      case 'invisible':
        return '⚫';
      default:
        return '';
    }
  }, [status]);

  return { status, busyScope, updateStatus, statusLabel, statusIcon };
};

export default useUserStatus;
