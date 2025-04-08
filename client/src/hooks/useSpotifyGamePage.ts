import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserContext from './useUserContext';
import { GameInstance, GameMove, SpotifyGameState, SpotifyMove } from '../types/types';

/**
 * Custom hook for managing the state and logic of a Spotify guessing game.
 * Handles user input for guesses and communicates with the server.
 * 
 * @param gameInstance - The current Spotify game instance.
 * @returns An object with:
 * - `user`: current user context
 * - `guess`: the player's current guess input
 * - `handleGuessChange`: input field change handler
 * - `handleSubmitGuess`: emits the guess to the server
 */
const useSpotifyGamePage = (gameInstance: GameInstance<SpotifyGameState>) => {
    const { user, socket } = useUserContext();
    const [guess, setGuess] = useState('');
    const [isRestarting, setIsRestarting] = useState(false);
    const navigate = useNavigate();

    const handleSubmitGuess = () => {
        const move: GameMove<SpotifyMove> = {
            playerID: user.username,
            gameID: gameInstance.gameID,
            move: { guess },
        };

        socket.emit('makeMove', {
            gameID: gameInstance.gameID,
            move,
        });

        setGuess('');
    };

    const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGuess(e.target.value);
    };

    const handleRestartGame = async () => {
        setIsRestarting(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/games/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameType: 'Spotify',
                    username: user.username,
                    accessToken: user.spotifyAccessToken,
                }),
            });

            const newGameId = await response.json();
            if (typeof newGameId === 'string') {
                navigate(`/games/${newGameId}`);
            } 
            else {
                console.error('Failed to restart game:', newGameId);
            }
        } catch (err) {
            console.error('Error restarting game:', err);
        }
        finally {
            setIsRestarting(false);
        }
    };

    return {
        user,
        guess,
        handleGuessChange,
        handleSubmitGuess,
        handleRestartGame,
        isRestarting
    };
};

export default useSpotifyGamePage;
