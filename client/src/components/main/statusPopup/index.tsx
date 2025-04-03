import React, { useState } from 'react';
import './index.css';
import {
  BsChevronLeft,
  BsChevronRight,
} from 'react-icons/bs';
import UserStatusIcon from '../UserStatusIcon';

interface StatusPopupProps {
  username: string;
  currentStatus: 'online' | 'away' | 'busy' | 'invisible';
  currentBusyScope?: 'friends-only' | 'everyone';
  onClose: () => void;
  onSelect: (
    status: 'online' | 'away' | 'busy' | 'invisible',
    busyScope?: 'friends-only' | 'everyone',
  ) => void;
}

const StatusPopup = ({
  currentStatus,
  currentBusyScope,
  onClose,
  onSelect,
}: StatusPopupProps) => {
  const [showDndOptions, setShowDndOptions] = useState(false);
  const handleSelect = (
    status: 'online' | 'away' | 'busy' | 'invisible',
    busyScope?: 'friends-only' | 'everyone',
  ) => {
    onSelect(status, busyScope);
    onClose();
  };

  const isSelected = (
    status: 'online' | 'away' | 'busy' | 'invisible',
    scope?: 'friends-only' | 'everyone',
  ) => currentStatus === status && (status !== 'busy' || currentBusyScope === scope);

  return (
    <div className='status-popup'>
      <div
        className={`status-option ${isSelected('online') ? 'selected' : ''}`}
        onClick={() => handleSelect('online')}>
        <UserStatusIcon status='online' />
        <div className='status-info'>
          <div className='status-label'>Online</div>
        </div>
      </div>

      <div
        className={`status-option ${isSelected('away') ? 'selected' : ''}`}
        onClick={() => handleSelect('away')}>
        <UserStatusIcon status='away' />
        <div className='status-info'>
          <div className='status-label'>Idle</div>
        </div>
      </div>

      <div
        className={`status-option dnd ${currentStatus === 'busy' ? 'selected' : ''}`}
        onClick={() => setShowDndOptions(!showDndOptions)}
        style={{ position: 'relative' }}>
        <UserStatusIcon status='busy' />
        <div className='status-info'>
          <div className='status-label'>Do Not Disturb</div>
        </div>
        {showDndOptions ? (
          <BsChevronLeft className='chevron-icon' />
        ) : (
          <BsChevronRight className='chevron-icon' />
        )}

        {showDndOptions && (
          <div className='dnd-submenu'>
            <div
              className={`status-option ${isSelected('busy', 'everyone') ? 'selected' : ''}`}
              onClick={() => handleSelect('busy', 'everyone')}>
              Mute Everyone
            </div>
            <div
              className={`status-option ${isSelected('busy', 'friends-only') ? 'selected' : ''}`}
              onClick={() => handleSelect('busy', 'friends-only')}>
              Mute Everyone But Friends
            </div>
          </div>
        )}
      </div>

      <div
        className={`status-option ${isSelected('invisible') ? 'selected' : ''}`}
        onClick={() => handleSelect('invisible')}>
        <UserStatusIcon status='invisible' />
        <div className='status-info'>
          <div className='status-label'>Invisible</div>
          <div className='status-desc'>You will not appear online, but still have access.</div>
        </div>
      </div>
    </div>
  );
};

export default StatusPopup;
