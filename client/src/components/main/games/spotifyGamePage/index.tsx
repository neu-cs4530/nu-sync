import React from 'react';
import './index.css';
import { GameInstance, SpotifyGameState } from '../../../../types/types';
import useSpotifyGamePage from '../../../../hooks/useSpotifyGamePage';

/**
 * Displays the UI for the Spotify guessing game.
 */
const SpotifyGamePage = ({ gameInstance }: { gameInstance: GameInstance<SpotifyGameState> }) => {
    const { user, guess, handleGuessChange, handleSubmitGuess, handleRestartGame, isRestarting } = useSpotifyGamePage(gameInstance);

    const isPlayer = user.username === gameInstance.state.player;
    const isGameOver = gameInstance.state.status === 'OVER';
    const hasWon = gameInstance.state.won;

    return (
        <div className='spotify-game-container'>
            <h2 className='spotify-title'>
                <svg viewBox="0 0 168 168" xmlns="http://www.w3.org/2000/svg">
                    <circle fill="#1ED760" cx="84" cy="84" r="84" />
                    <path
                        d="M119.3 117.6c-1.7 2.6-5.2 3.4-7.8 1.8-21.3-13-48.1-15.9-79.6-8.7-3 0.7-6.1-1.1-6.8-4.2-.7-3 1.1-6.1 4.2-6.8 34.8-8 66.7-4.7 91.6 10.2 2.5 1.5 3.4 5 1.8 7.7zm10.9-21.8c-2.1 3.1-6.3 4.1-9.4 2.1-24.4-15.3-61.6-19.8-90.2-10.8-3.6 1.1-7.4-0.9-8.5-4.5s0.9-7.4 4.5-8.5c33.7-10.3 75.6-5.2 104.7 12.2 3.1 2 4 6.2 2 9.5zm0.9-22.9c-28-17.1-74.7-18.7-101.4-10.2-4.1 1.3-8.5-1-9.8-5.1s1-8.5 5.1-9.8c30.8-9.5 83.1-7.7 116.2 11.5 3.7 2.3 4.9 7.1 2.6 10.8s-7.1 4.9-10.7 2.8z"
                        fill="#000"
                    />
                </svg>
                Spotify Guessing Game
            </h2>

            <div className='spotify-hint-box'>
                <p className='hint-label'>Hint:</p>
                <p className='hint-text'>{gameInstance.state.hint}</p>
            </div>

            <div className='game-info'>
                <p><strong>Remaining Guesses:</strong> {gameInstance.state.remainingGuesses}</p>
            </div>

            {!isGameOver && isPlayer && (
                <div className='guess-section'>
                    <input
                        type='text'
                        className='guess-input'
                        value={guess}
                        onChange={handleGuessChange}
                        placeholder='Guess the song title'
                    />
                    <button className='btn-guess' onClick={handleSubmitGuess}>
                        Submit Guess
                    </button>
                </div>
            )}

            {isGameOver && (
                <div className={`game-result ${hasWon ? 'won' : 'lost'}`}>
                    {hasWon ? (
                        <>
                            <h3>🎉 You got it right!</h3>
                            <p>
                                The song was <strong>{gameInstance.state.songName}</strong> by{' '}
                                <strong>{gameInstance.state.artistName}</strong>.
                            </p>
                        </>
                    ) : (
                        <>
                            <h3>😢 Game Over!</h3>
                            <p>
                                The correct answer was <strong>{gameInstance.state.songName}</strong> by{' '}
                                <strong>{gameInstance.state.artistName}</strong>.
                            </p>
                        </>
                    )}
                    <button className="btn-restart" onClick={handleRestartGame} disabled={isRestarting}>
                        Play Again
                        {isRestarting && <span className="spinner" />}
                    </button>
                </div>
                
            )}
        </div>
    );
};

export default SpotifyGamePage;
