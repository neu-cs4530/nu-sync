import React, { useState } from 'react';
import './index.css';
import {
  BsCircleFill,
  BsMoonFill,
  BsDashCircleFill,
  BsSlashCircleFill,
  BsChevronDown,
  BsChevronUp,
} from 'react-icons/bs';

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
        <BsCircleFill className='status-icon online' />
        <div className='status-info'>
          <div className='status-label'>Online</div>
        </div>
      </div>

      <div
        className={`status-option ${isSelected('away') ? 'selected' : ''}`}
        onClick={() => handleSelect('away')}>
        <BsMoonFill className='status-icon away' />
        <div className='status-info'>
          <div className='status-label'>Idle</div>
        </div>
      </div>

      <div
        className={`status-option ${currentStatus === 'busy' ? 'selected' : ''}`}
        onClick={() => setShowDndOptions(!showDndOptions)}>
        <BsDashCircleFill className='status-icon busy' />
        <div className='status-info'>
          <div className='status-label'>Do Not Disturb  </div>
        </div>
        {showDndOptions ? (
          <BsChevronUp className='chevron-icon' />
        ) : (
          <BsChevronDown className='chevron-icon' />
        )}
      </div>

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

      <div
        className={`status-option ${isSelected('invisible') ? 'selected' : ''}`}
        onClick={() => handleSelect('invisible')}>
        <BsSlashCircleFill className='status-icon invisible' />
        <div className='status-info'>
          <div className='status-label'>Invisible</div>
          <div className='status-desc'>You will not appear online, but still have access.</div>
        </div>
      </div>
    </div>
  );
};

export default StatusPopup;
