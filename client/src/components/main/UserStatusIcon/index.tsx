import React from 'react';
import { BsCircleFill, BsMoonFill, BsDashCircleFill, BsSlashCircleFill } from 'react-icons/bs';
import './index.css';

interface Props {
  status: 'online' | 'away' | 'busy' | 'invisible';
}

const UserStatusIcon: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'online':
      return <BsCircleFill className='status-icon online' title='Online' />;
    case 'away':
      return <BsMoonFill className='status-icon away' title='Idle' />;
    case 'busy':
      return <BsDashCircleFill className='status-icon busy' title='Do Not Disturb' />;
    case 'invisible':
      return (
        <BsSlashCircleFill
          className='status-icon invisible'
          title='Invisible'
          style={{ fontSize: 16 }}
        />
      );
    default:
      return null; // don't render anything if invalid
  }
};

export default UserStatusIcon;
