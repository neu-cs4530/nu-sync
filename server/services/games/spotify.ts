import { nanoid } from 'nanoid';
import axios from 'axios';
import { 
  BaseMove, 
  GameInstance, 
  GameInstanceID, 
  GameMove, 
  GameState, 
  GameType,
  SpotifyGameState
} from '../../types/types';
import Game from './game';
import GameModel from '../../models/games.model';

/**
 * Interface representing a move in a Spotify game.
 * - `guess`: The song name guessed by the player.
 */
export interface SpotifyMove extends BaseMove {
  guess: string;
}

/**
 * Class representing a Spotify music guessing game.
 * 
 * This game selects a random song from the player's top tracks or playlist,
 * generates a hint for the song, and allows the player to guess the song name.
 */
class SpotifyGame extends Game<SpotifyGameState, SpotifyMove> {
  private _selectedSong: {
    id: string;
    name: string;
    artist: string;
  } | null = null;
  
  private _hint: string | null = null;
  
  private _accessToken: string | null = null;
  
  private _username: string | null = null;

  /**
   * Creates a new Spotify game instance.
   * @param username The username of the player.
   * @param accessToken The Spotify access token.
   */
  constructor(username: string, accessToken: string) {
    const initialState: SpotifyGameState = {
      status: 'WAITING_TO_START',
      guesses: [],
      correct: false,
      roundsPlayed: 0
    };
    
    super(initialState, 'Spotify');
    this._username = username;
    this._accessToken = accessToken;
  }

  /**
   * Applies a move to the game state.
   * @param move The move to apply.
   */
  public applyMove(move: GameMove<SpotifyMove>): void {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new Error('Game is not in progress');
    }

    if (!this._selectedSong) {
      throw new Error('No song selected');
    }

    const guess = move.move.guess.toLowerCase();
    const correctSongName = this._selectedSong.name.toLowerCase();
    
    // Add the guess to the list of guesses
    const currentState = this.state;
    this.state = {
      ...currentState,
      guesses: [...currentState.guesses, guess]
    };

    // Check if the guess is correct
    if (guess === correctSongName) {
      this.state = {
        ...this.state,
        correct: true,
        status: 'OVER'
      };
    } else {
      // If the player has made 3 guesses, end the game
      if (this.state.guesses.length >= 3) {
        this.state = {
          ...this.state,
          status: 'OVER'
        };
      }
    }
  }

  /**
   * Handles a player joining the game.
   * @param playerID The player ID to join.
   */
  protected _join(playerID: string): void {
    // For a single-player game, we can start the game when the player joins
    if (this._players.length === 0) {
      this.startGame();
    }
  }

  /**
   * Handles a player leaving the game.
   * @param playerID The player ID to leave.
   */
  protected _leave(playerID: string): void {
    // For a single-player game, we can end the game when the player leaves
    this.state = {
      ...this.state,
      status: 'OVER'
    };
  }

  /**
   * Starts the game by selecting a random song and generating a hint.
   */
  public async startGame(): Promise<void> {
    if (!this._accessToken || !this._username) {
      throw new Error('Missing access token or username');
    }

    try {
      // Get the user's top tracks
      const topTracksResponse = await axios.get(
        'https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50',
        {
          headers: {
            Authorization: `Bearer ${this._accessToken}`,
          },
        }
      );

      const tracks = topTracksResponse.data.items;
      
      if (tracks.length === 0) {
        throw new Error('No tracks found');
      }

      // Select a random track
      const randomIndex = Math.floor(Math.random() * tracks.length);
      const selectedTrack = tracks[randomIndex];
      
      this._selectedSong = {
        id: selectedTrack.id,
        name: selectedTrack.name,
        artist: selectedTrack.artists[0].name
      };

      // Generate a hint for the song
      this._hint = await this._generateHint(this._selectedSong.name, this._selectedSong.artist);

      // Update the game state
      this.state = {
        ...this.state,
        status: 'IN_PROGRESS',
        guesses: [],
        correct: false,
        roundsPlayed: this.state.roundsPlayed + 1
      };
    } catch (error) {
      console.error('Error starting Spotify game:', error);
      throw new Error('Failed to start game');
    }
  }

  /**
   * Generates a hint for a song.
   * @param songName The name of the song.
   * @param artistName The name of the artist.
   * @returns A hint for the song.
   */
  private async _generateHint(songName: string, artistName: string): Promise<string> {
    // In a real implementation, you would call an AI service to generate a hint
    // For now, we'll use a simple placeholder hint
    return `This song by ${artistName} is known for its distinctive melody.`;
  }

  /**
   * Gets the current hint for the song.
   * @returns The current hint.
   */
  public get hint(): string | null {
    return this._hint;
  }

  /**
   * Gets the selected song.
   * @returns The selected song.
   */
  public get selectedSong(): { id: string; name: string; artist: string; } | null {
    return this._selectedSong;
  }

  /**
   * Converts the game instance to a model that can be stored in the database.
   * @returns The game model representation.
   */
  public toModel(): GameInstance<SpotifyGameState> {
    return {
      state: {
        ...this.state,
        selectedSong: this._selectedSong?.name || undefined,
        hint: this._hint || undefined
      },
      gameID: this.id,
      players: this._players,
      gameType: this.gameType,
    };
  }
}

export default SpotifyGame; 