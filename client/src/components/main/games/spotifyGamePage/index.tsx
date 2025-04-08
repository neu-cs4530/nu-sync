import React, { useEffect, useState, useRef } from 'react';
import './index.css';
import { createGame, joinGame } from '../../../../services/gamesService';
import { loginSpotify } from '../../../../services/spotifyService';
import { GameInstance, GameType } from '../../../../types/types';

interface SpotifyGameState {
  status: 'PLAYING' | 'WIN' | 'LOSE';
  hint: string;
  attemptsLeft: number;
  guess: string;
  answer: string;
  gameId: string | null;
  isLoading: boolean;
  error: string | null;
  isSpotifyConnected: boolean;
}

const SpotifyGamePage: React.FC = () => {
  const [gameState, setGameState] = useState<SpotifyGameState>({
    status: 'PLAYING',
    hint: '',
    attemptsLeft: 3,
    guess: '',
    answer: '',
    gameId: null,
    isLoading: true,
    error: null,
    isSpotifyConnected: false,
  });
  
  const guessInputRef = useRef<HTMLInputElement>(null);

  // Check Spotify connection status
  useEffect(() => {
    const checkSpotifyConnection = () => {
      try {
        const username = localStorage.getItem('username');
        if (!username) {
          setGameState(prev => ({ ...prev, error: 'User not logged in', isLoading: false }));
          return;
        }
        
        // Check if Spotify access token exists in localStorage
        const spotifyAccessToken = localStorage.getItem('spotify_access_token');
        const isConnected = !!spotifyAccessToken;
        
        setGameState(prev => ({ ...prev, isSpotifyConnected: isConnected, isLoading: false }));
      } catch (error) {
        setGameState(prev => ({ ...prev, error: 'Error checking Spotify connection', isLoading: false }));
      }
    };
    
    checkSpotifyConnection();
  }, []);

  // Start a new game
  const startGame = async () => {
    setGameState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const username = localStorage.getItem('username');
      if (!username) {
        throw new Error('User not logged in');
      }
      
      // Create a new Spotify game
      const game = await createGame('Spotify' as GameType);
      
      // Join the game
      const updatedGame = await joinGame(game.gameID, username);
      
      // Get the game state from the response
      const spotifyGameState = updatedGame.state as any;
      
      setGameState({
        status: 'PLAYING',
        hint: spotifyGameState.hint || 'Loading hint...',
        attemptsLeft: 3,
        guess: '',
        answer: spotifyGameState.selectedSong || '',
        gameId: game.gameID,
        isLoading: false,
        error: null,
        isSpotifyConnected: true,
      });
      
      // Focus the input field
      if (guessInputRef.current) {
        guessInputRef.current.focus();
      }
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'Error starting game. Please try again.', 
        isLoading: false 
      }));
    }
  };

  // Submit a guess
  const handleGuess = async () => {
    if (!gameState.guess.trim() || gameState.isLoading) return;
    
    setGameState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const username = localStorage.getItem('username');
      if (!username) {
        throw new Error('User not logged in');
      }
      
      // Submit the guess to the backend
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/spotify/game/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: gameState.gameId,
          guess: gameState.guess,
          username,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update game state based on the response
        if (data.correct) {
          setGameState(prev => ({ ...prev, status: 'WIN', isLoading: false }));
        } else {
          setGameState(prev => ({ 
            ...prev, 
            attemptsLeft: prev.attemptsLeft - 1,
            guess: '',
            status: prev.attemptsLeft - 1 === 0 ? 'LOSE' : 'PLAYING',
            isLoading: false,
          }));
        }
      } else {
        throw new Error(data.error || 'Error submitting guess');
      }
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'Error submitting guess. Please try again.', 
        isLoading: false 
      }));
    }
  };

  // Handle key press for submitting guess
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGuess();
    }
  };

  // Connect to Spotify
  const handleConnectSpotify = () => {
    loginSpotify();
  };

  // Start a new game
  const restartGame = () => {
    startGame();
  };

  // Show loading state
  if (gameState.isLoading && !gameState.hint) {
    return (
      <div className="spotify-game-container">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  // Show error state
  if (gameState.error) {
    return (
      <div className="spotify-game-container">
        <div className="error-message">{gameState.error}</div>
        <button onClick={restartGame} className="restart-btn">
          Try Again
        </button>
      </div>
    );
  }

  // Show Spotify connection required
  if (!gameState.isSpotifyConnected) {
    return (
      <div className="spotify-game-container">
        <h2>🎵 Spotify Music Guessing Game</h2>
        <p>You need to connect your Spotify account to play this game.</p>
        <button onClick={handleConnectSpotify} className="spotify-connect-btn">
          Connect Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="spotify-game-container">
      <h2>🎵 Guess the Song!</h2>
      
      <div className="game-info">
        <p className="attempts-left">Attempts Left: {gameState.attemptsLeft}</p>
        {gameState.gameId && <p className="game-id">Game ID: {gameState.gameId}</p>}
      </div>
      
      <div className="hint-section">
        <p className="hint-label">Hint:</p>
        <p className="hint">{gameState.hint}</p>
      </div>

      {gameState.status === 'PLAYING' && (
        <div className="guess-section">
          <input
            ref={guessInputRef}
            type="text"
            placeholder="Your guess here..."
            value={gameState.guess}
            onChange={(e) => setGameState(prev => ({ ...prev, guess: e.target.value }))}
            onKeyPress={handleKeyPress}
            className="guess-input"
            disabled={gameState.isLoading}
          />
          <button 
            onClick={handleGuess} 
            className="guess-btn"
            disabled={gameState.isLoading || !gameState.guess.trim()}
          >
            {gameState.isLoading ? 'Submitting...' : 'Submit Guess'}
          </button>
        </div>
      )}

      {gameState.status === 'WIN' && (
        <div className="result win">
          <p>✅ Correct! You guessed the song.</p>
          <button onClick={restartGame} className="restart-btn">
            Play Again
          </button>
        </div>
      )}

      {gameState.status === 'LOSE' && (
        <div className="result lose">
          <p>❌ Out of guesses. The song was: <strong>{gameState.answer}</strong></p>
          <button onClick={restartGame} className="restart-btn">
            Try Another
          </button>
        </div>
      )}
    </div>
  );
};

export default SpotifyGamePage;
