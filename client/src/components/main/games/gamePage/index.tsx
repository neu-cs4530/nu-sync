import React from 'react';
import './index.css';
import NimGamePage from '../nimGamePage';
import useGamePage from '../../../../hooks/useGamePage';
import { GameInstance, NimGameState, SpotifyGameState } from '../../../../types/types';
import SpotifyGamePage from '../spotifyGamePage';

/**
 * Component to display the game page for a specific game type, including controls and game state.
 * @returns A React component rendering:
 * - A header with the game title and current game status.
 * - A "Leave Game" button to exit the current game.
 * - The game component specific to the game type (e.g., `NimGamePage` for "Nim").
 * - An error message if an error occurs during the game.
 */
const GamePage = () => {
  const { gameInstance, error, handleLeaveGame } = useGamePage();

  const formatStatus = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'OVER':
        return 'Game Over';
      case 'WAITING_TO_START':
        return 'Waiting for Player 2';
      default:
        return status;
    }
  };


  /**
   * Renders the appropriate game component based on the game type.
   * @param gameType The type of the game to render (e.g., "Nim").
   * @returns A React component corresponding to the specified game type, or a
   * fallback message for unknown types.
   */
  const renderGameComponent = (gameType: string) => {
    if (!gameInstance) return null;

    switch (gameType) {
      case 'Nim':
        return <NimGamePage gameInstance={gameInstance as GameInstance<NimGameState>} />;
      case 'Spotify':
        return <SpotifyGamePage gameInstance={gameInstance as GameInstance<SpotifyGameState>} />;
      default:
        return <div>Unknown game type</div>;
    }
  };

  return (
    <div className='game-page'>
      <header className='game-header'>
        <h1>
          {gameInstance?.gameType === 'Nim' && 'Nim Game'}
          {gameInstance?.gameType === 'Spotify' && 'Spotify Guessing Game'}
        </h1>
        <p className='game-status'>
          <strong>{gameInstance ? formatStatus(gameInstance.state.status) : 'Not Started'}</strong>
        </p>
      </header>
      {gameInstance?.gameType === 'Spotify' && (
        <section className="game-rules">
          <h2>🎧 How to Play</h2>
          <ul>
            <li>You’ll get a hint about one of your favorite songs.</li>
            <li>You have 3 guesses to name the correct song title.</li>
            <li>Hints are based on song vibe, remix, or trivia — not the name!</li>
            <li>Hit <strong>Submit Guess</strong> each time you try.</li>
            <li>Game ends when you get it right or run out of guesses.</li>
          </ul>
        </section>
      )}

      <div className='game-controls'>
        <button className='btn-leave-game' onClick={handleLeaveGame}>
          Leave Game
        </button>
      </div>

      {gameInstance && renderGameComponent(gameInstance.gameType)}

      {error && <div className='game-error'>{error}</div>}
    </div>
  );
};

export default GamePage;
