import { supabase } from "@/src/lib/supabase";

// Profile types
export interface Profile {
  id: string;
  display_name: string | null;
  email: string;
  photo_url: string | null;
  last_login: string | null;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  user_id: string;
  tmdb_id: number;
  title: string;
  media_type: "movie" | "tv";
  poster_path: string | null;
  release_date: string | null;
  vote: number | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  added_at: string;
}

export interface WatchHistoryItem {
  id: number;
  user_id: string;
  tmdb_id: number;
  title: string;
  media_type: "movie" | "tv";
  poster_path: string | null;
  release_date: string | null;
  duration_sec: number | null;
  watched_at: string;
}

// Profile Functions --------------------------------------------------------
export async function ensureUserProfile(user: {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}) {
  // Check if profile exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.uid)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = "no rows returned", which is expected for new users
    throw fetchError;
  }

  // Create or update profile
  if (!existingProfile) {
    // Create new profile with current login time
    const profileData = {
      id: user.uid,
      email: user.email,
      display_name: user.displayName,
      photo_url: user.photoURL,
      last_login: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from("profiles")
      .insert(profileData)
      .select();

    if (insertError) {
      // If it's a duplicate key error, that's actually fine - it means profile was created
      if (insertError.code === "23505") {
        return;
      }
      throw insertError;
    }
  } else {
    // Update last_login for existing profile
    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.uid);
  }
}

// Watchlist Functions ------------------------------------------------------

// Add a movie or TV show to watchlist
export async function addToWatchlist(
  userId: string,
  item: {
    tmdb_id: number;
    title: string;
    media_type: "movie" | "tv";
    poster_path: string | null;
    release_date: string | null;
    vote: number | null;
    number_of_seasons?: number | null;
    number_of_episodes?: number | null;
  }
) {
  console.log("📌 [addToWatchlist] Adding item:", {
    userId,
    tmdb_id: item.tmdb_id,
    title: item.title,
    media_type: item.media_type,
    seasons: item.number_of_seasons,
    episodes: item.number_of_episodes,
  });

  const { data, error } = await supabase
    .from("watchlist")
    .insert({
      user_id: userId,
      ...item,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ [addToWatchlist] Error:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    throw error;
  }

  console.log("✅ [addToWatchlist] Successfully added:", data);
  return data as WatchlistItem;
}

// Remove from watchlist
export async function removeFromWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: "movie" | "tv"
) {
  console.log("🗑️ [removeFromWatchlist] Removing item:", {
    userId,
    tmdbId,
    mediaType,
  });

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    console.error("❌ [removeFromWatchlist] Error:", error.message);
    throw error;
  }

  console.log("✅ [removeFromWatchlist] Successfully removed");
}

// Get user's watchlist
export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
  console.log("📋 [getWatchlist] Fetching watchlist for user:", userId);

  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) {
    console.error("❌ [getWatchlist] Error:", error.message);
    throw error;
  }

  console.log("✅ [getWatchlist] Found items:", data?.length || 0);
  return data || [];
}

// Check if item is in watchlist
export async function isInWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<boolean> {
  const { data, error } = await supabase
    .from("watchlist")
    .select("id")
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("❌ [isInWatchlist] Error:", error.message);
    throw error;
  }

  const inWatchlist = !!data;
  console.log(`🔍 [isInWatchlist] Item ${tmdbId} in watchlist:`, inWatchlist);
  return inWatchlist;
}

// Get watchlist by type
export async function getWatchlistByType(
  userId: string,
  mediaType: "movie" | "tv"
): Promise<WatchlistItem[]> {
  console.log(
    `🎬 [getWatchlistByType] Fetching ${mediaType} watchlist for user:`,
    userId
  );

  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .order("added_at", { ascending: false });

  if (error) {
    console.error("❌ [getWatchlistByType] Error:", error.message);
    throw error;
  }

  console.log(
    `✅ [getWatchlistByType] Found ${mediaType} items:`,
    data?.length || 0
  );
  return data || [];
}

// Watch History Functions --------------------------------------------------

// Add to watch history
export async function addToWatchHistory(
  userId: string,
  item: {
    tmdb_id: number;
    title: string;
    media_type: "movie" | "tv";
    poster_path: string | null;
    release_date: string | null;
    duration_sec: number | null;
  }
) {
  const { data, error } = await supabase
    .from("watch_history")
    .insert({
      user_id: userId,
      ...item,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WatchHistoryItem;
}

// Get watch history
export async function getWatchHistory(
  userId: string
): Promise<WatchHistoryItem[]> {
  const { data, error } = await supabase
    .from("watch_history")
    .select("*")
    .eq("user_id", userId)
    .order("watched_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get recently watched (last N items)
export async function getRecentlyWatched(
  userId: string,
  limit = 10
): Promise<WatchHistoryItem[]> {
  const { data, error } = await supabase
    .from("watch_history")
    .select("*")
    .eq("user_id", userId)
    .order("watched_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Remove from watch history
export async function removeFromWatchHistory(
  userId: string,
  historyId: number
) {
  const { error } = await supabase
    .from("watch_history")
    .delete()
    .eq("user_id", userId)
    .eq("id", historyId);

  if (error) throw error;
}
