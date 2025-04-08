import React from 'react';
import './index.css';
import useAllGamesPage from '../../../../hooks/useAllGamesPage';
import GameCard from './gameCard';

/**
 * Component to display the "All Games" page, which provides functionality to view, create, and join games.
 * @returns A React component that includes:
 * - A "Create Game" button to open a modal for selecting a game type.
 * - A list of available games, each rendered using the `GameCard` component.
 * - A refresh button to reload the list of available games from the server.
 */
const AllGamesPage = () => {
  const {
    availableGames,
    handleJoin,
    fetchGames,
    isModalOpen,
    handleToggleModal,
    handleSelectGameType,
    error,
    isCreating
  } = useAllGamesPage();

  return (
    <div className='game-page'>
      <div className='game-controls'>
        <button className='btn-create-game' onClick={handleToggleModal}>
          Create Game
        </button>
      </div>

      {/* {isModalOpen && (
        <div className='game-modal'>
          <div className='modal-content'>
            <h2>Select Game Type</h2>
            <div className="game-type-row">
              <button className='btn-game-option' onClick={() => handleSelectGameType('Nim')}>Nim Game</button>
              <button className='btn-game-option' onClick={() => handleSelectGameType('Spotify')}>Spotify Guessing Game</button>
            </div>
            <div className="cancel-row">
              <button className='btn-cancel' onClick={handleToggleModal}>Cancel</button>
            </div>
          </div>
        </div>
      )} */}

      {isModalOpen && (
        <div className='game-modal'>
          <div className='modal-content'>
            <h2>Select Game Type</h2>
            <div className="game-type-row">
              <button
                className='btn-game-option'
                onClick={() => handleSelectGameType('Nim')}
                disabled={isCreating}
              >
                {isCreating ? 'Loading...' : 'Nim Game'}
              </button>
              <button
                className='btn-game-option'
                onClick={() => handleSelectGameType('Spotify')}
                disabled={isCreating}
              >
                {isCreating ? (<>
                  Loading<span className="spinner" />
                </>) : 'Spotify Guessing Game'}
              </button>
            </div>
            <div className="cancel-row">
              <button className='btn-cancel' onClick={handleToggleModal} disabled={isCreating}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='game-available'>
        <div className='game-list'>
          {error && <div className='game-error'>{error}</div>}
          <h2>Available Games</h2>
          <button className='btn-refresh-list' onClick={fetchGames}>
            Refresh List
          </button>
          <div className='game-items'>
            {availableGames.map(game => (
              <GameCard key={game.gameID} game={game} handleJoin={handleJoin} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllGamesPage;
