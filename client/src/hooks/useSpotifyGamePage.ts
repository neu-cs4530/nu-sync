import { useState } from 'react';
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

    return {
        user,
        guess,
        handleGuessChange,
        handleSubmitGuess,
    };
};

export default useSpotifyGamePage;
