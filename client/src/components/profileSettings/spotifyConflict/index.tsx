import React from 'react';
import './index.css';

interface SpotifyConflictModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const SpotifyConflictModal = ({ onConfirm, onCancel }: SpotifyConflictModalProps) => (
    <div className='modal'>
      <div className='modal-content'>
        <p>
          This Spotify account is already connected to another user. Would you like to unlink it
          from all other accounts and continue?
        </p>
        <button className='login-button' onClick={onConfirm}>
          Yes, unlink and continue
        </button>
        <button className='cancel-button' onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );

export default SpotifyConflictModal;