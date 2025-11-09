// Watchlist items are per-user subcollection: `users/{uid}/watchlist`

export type MediaType = "movie" | "tv";

export interface WatchlistItem {
  id: string; // tmdb id as string
  type: MediaType;
  title: string;
  poster: string | null;
  backdrop: string | null;
  releaseDate?: string | null;
  addedAt: number; // unix epoch ms
}
