// ensures correct response format from spotify
export interface SpotifyTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}