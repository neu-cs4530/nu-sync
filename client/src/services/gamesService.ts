import { GameInstance, GameState, GameStatus, GameType } from '../types/types';
import api from './config';

const GAMES_API_URL = `${process.env.REACT_APP_SERVER_URL}/games`;
const SPOTIFY_SERVER_URL = `${process.env.REACT_APP_SERVER_URL}/spotify`;

/**
 * Function to create a new game of the specified type. This puts the game in the database.
 * @param gameType The type of game to create.
 * @returns A promise resolving to the created game instance.
 * @throws Error if there is an issue while creating the game.
 */
const createGame = async (gameType: GameType): Promise<GameInstance<GameState>> => {

  console.log("I AM HERE in createGame")

  if (gameType === 'Spotify') {
     
    // extract username from local storage
    const userRaw = localStorage.getItem('user');
    let username: string | null = null;

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        username = user.username;
      } catch (err) {
        console.error('Failed to parse user from localStorage:', err);
      }
    }

    const accessToken = localStorage.getItem('spotify_access_token');

    if (!username || !accessToken) {
      throw new Error('Username and access token are required for Spotify games');
    }

    const res = await api.post(`${GAMES_API_URL}/create`, {
      gameType,
      username,
      accessToken,
    });

    if (res.status !== 200) {
      throw new Error('Error while creating a new Spotify game');
    }

    const gameId = res.data;

    console.log("gameId in createGame", gameId)

    // Step 2: Fetch full game info
    const gameDetailsRes = await api.get(`${GAMES_API_URL}/game/${gameId}`);
    const game = gameDetailsRes.data;

    console.log("game in createGame", game)

    // Step 3: Generate the hint
    try {
      const hintRes = await api.post(`${SPOTIFY_SERVER_URL}/generateHint`, {
        songName: game?.state?.songName || 'Unknown Song',
        artistName: game?.state?.artistName || 'Unknown Artist',
        gameId,
      });

      if (hintRes.status === 200) {
        game.state.hint = hintRes.data.hint;
      } else {
        console.warn('Hint generation failed');
      }
    } catch (error) {
      console.error('Error generating hint:', error);
    }

    return res.data;
    
  }


  // use this section for all other game types
  const res = await api.post(`${GAMES_API_URL}/create`, {
    gameType,
  });

  if (res.status !== 200) {
    throw new Error('Error while creating a new game');
  }


  console.log("res.data in createGame", res.data)

  return res.data;
};

/**
 * Function to fetch a list of games based on optional filters for game type and status.
 * @param gameType (Optional) The type of games to filter by.
 * @param status (Optional) The status of games to filter by.
 * @returns A promise resolving to a list of game instances.
 * @throws Error if there is an issue while fetching the games.
 */
const getGames = async (
  gameType: GameType | undefined,
  status: GameStatus | undefined,
): Promise<GameInstance<GameState>[]> => {
  const params = new URLSearchParams();

  if (gameType) {
    params.append('gameType', gameType);
  }

  if (status) {
    params.append('status', status);
  }

  const res = await api.get(`${GAMES_API_URL}/games`, {
    params,
  });

  if (res.status !== 200) {
    throw new Error('Error while getting games');
  }

  return res.data;
};

/**
 * Function to join an existing game.
 * @param gameID The ID of the game to join.
 * @param playerID The ID of the player joining the game.
 * @returns A promise resolving to the updated game instance.
 * @throws Error if there is an issue while joining the game.
 */
const joinGame = async (gameID: string, playerID: string): Promise<GameInstance<GameState>> => {
  const res = await api.post(`${GAMES_API_URL}/join`, {
    gameID,
    playerID,
  });

  if (res.status !== 200) {
    throw new Error('Error while joining a game');
  }

  return res.data;
};

/**
 * Function to leave a game.
 * @param gameID The ID of the game to leave.
 * @param playerID The ID of the player leaving the game.
 * @returns A promise resolving to the updated game instance.
 * @throws Error if there is an issue while leaving the game.
 */
const leaveGame = async (gameID: string, playerID: string): Promise<GameInstance<GameState>> => {
  const res = await api.post(`${GAMES_API_URL}/leave`, {
    gameID,
    playerID,
  });

  if (res.status !== 200) {
    throw new Error('Error while leaving a game');
  }

  return res.data;
};

export { createGame, getGames, joinGame, leaveGame };
