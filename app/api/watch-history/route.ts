import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // Get the auth token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ Watch History: Missing or invalid auth token");
      return NextResponse.json(
        { error: "Unauthorized - missing auth token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Create an authenticated Supabase client using the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const body = await request.json();
    const {
      user_id,
      tmdb_id,
      title,
      media_type,
      stream_id,
      poster_path,
      release_date,
      duration_sec,
      season_number,
      episode_number,
    } = body;

    // Validate required fields
    if (!user_id || !tmdb_id || !title || !media_type || !stream_id) {
      console.error("❌ Watch History: Missing required fields", body);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate media_type
    if (!["movie", "tv"].includes(media_type)) {
      console.error("❌ Watch History: Invalid media_type", media_type);
      return NextResponse.json(
        { error: "Invalid media_type. Must be 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    // Validate stream_id
    const validStreamIds = [
      "syntherionmovie",
      "ironlinkmovie",
      "dormannumovie",
      "nanovuemovie",
      "syntheriontv",
      "ironlinktv",
      "dormannutv",
      "nanovuetv",
    ];
    if (!validStreamIds.includes(stream_id)) {
      console.error("❌ Watch History: Invalid stream_id", stream_id);
      return NextResponse.json({ error: "Invalid stream_id" }, { status: 400 });
    }

    console.log(
      `📝 Watch History: Checking for existing record for user ${user_id} - ${media_type} ${tmdb_id} (${title})${
        media_type === "tv" ? ` S${season_number}E${episode_number}` : ""
      }`
    );

    // Check if this user has already watched this content
    // Match by user_id, tmdb_id, and media_type only (one row per show/movie)
    const { data: existingRecord } = await supabase
      .from("watch_history")
      .select("id, duration_sec")
      .eq("user_id", user_id)
      .eq("tmdb_id", tmdb_id)
      .eq("media_type", media_type)
      .maybeSingle();

    let data, error;

    if (existingRecord) {
      // Fetch the full existing record to compare season/episode
      const { data: fullRecord } = await supabase
        .from("watch_history")
        .select("season_number, episode_number, duration_sec")
        .eq("id", existingRecord.id)
        .maybeSingle();

      let newDuration;
      let logMsg;
      if (media_type === "movie") {
        // For movies, always accumulate duration
        newDuration = (fullRecord?.duration_sec || 0) + (duration_sec || 0);
        logMsg = `🔄 Watch History: Movie, accumulating duration (old: ${
          fullRecord?.duration_sec || 0
        }s, adding: ${duration_sec}s, total: ${newDuration}s)`;
      } else {
        // For TV shows, check episode/season
        if (
          fullRecord &&
          fullRecord.season_number === season_number &&
          fullRecord.episode_number === episode_number
        ) {
          newDuration = (fullRecord.duration_sec || 0) + (duration_sec || 0);
          logMsg = `🔄 Watch History: Same episode, accumulating duration (old: ${fullRecord.duration_sec}s, adding: ${duration_sec}s, total: ${newDuration}s)`;
        } else {
          // If episode/season changes, reset duration to new value
          newDuration = duration_sec || 0;
          logMsg = `🔄 Watch History: New episode/season, resetting duration to ${newDuration}s`;
        }
      }
      console.log(logMsg);

      const result = await supabase
        .from("watch_history")
        .update({
          title,
          stream_id,
          duration_sec: newDuration,
          watched_at: new Date().toISOString(),
          poster_path: poster_path || null,
          release_date: release_date || null,
          season_number: season_number || null,
          episode_number: episode_number || null,
        })
        .eq("id", existingRecord.id)
        .select();

      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      console.log(
        `➕ Watch History: Creating new record via ${stream_id}, duration: ${duration_sec}s`
      );

      const result = await supabase
        .from("watch_history")
        .insert([
          {
            user_id,
            tmdb_id,
            title,
            media_type,
            stream_id,
            poster_path: poster_path || null,
            release_date: release_date || null,
            duration_sec: duration_sec || 0,
            season_number: season_number || null,
            episode_number: episode_number || null,
          },
        ])
        .select();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("❌ Watch History: Supabase error", error);
      return NextResponse.json(
        { error: "Failed to save watch history", details: error.message },
        { status: 500 }
      );
    }

    console.log(
      `✅ Watch History: Successfully ${
        existingRecord ? "updated" : "created"
      } for ${media_type} ${tmdb_id}`
    );
    return NextResponse.json(
      { success: true, message: "Watch history saved", data },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Watch History: Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
