import React from 'react';
import './index.css';
import { GameInstance, SpotifyGameState } from '../../../../types/types';
import useSpotifyGamePage from '../../../../hooks/useSpotifyGamePage';

/**
 * Displays the UI for the Spotify guessing game.
 * Shows game hint, remaining guesses, and input to guess the song.
 */
const SpotifyGamePage = ({ gameInstance }: { gameInstance: GameInstance<SpotifyGameState> }) => {
    const { user, guess, handleGuessChange, handleSubmitGuess } = useSpotifyGamePage(gameInstance);

    const isPlayer = user.username === gameInstance.state.player;
    const isGameOver = gameInstance.state.status === 'OVER';
    const hasWon = gameInstance.state.won;

    return (
        <div className='spotify-game-container'>
            <h2 className='spotify-title'>🎵 Spotify Guessing Game</h2>

            <div className='spotify-hint-box'>
                <p className='hint-label'>Hint:</p>
                <p className='hint-text'>{gameInstance.state.hint}</p>

                <div className="visualizer">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                </div>
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
                </div>
            )}
        </div>
    );
};

export default SpotifyGamePage;
