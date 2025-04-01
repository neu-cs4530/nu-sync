// type for a song object
export interface SearchedSong {
  id: string;
  name: string;
  artists: { name: string }[];
}
// type for spotify playlist
export interface SpotifyPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: { url: string }[];
  name: string;
  owner: {
    display_name: string;
    external_urls: { spotify: string };
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  type: string;
  uri: string;
}

// type for a track item from Spotify
export type SpotifyTrackItem = {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    external_urls: { spotify: string };
  };
};

export type RecommendedSong = {
  name: string;
  artist: string;
  url: string;
};
