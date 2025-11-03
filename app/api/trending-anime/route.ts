import { NextResponse } from "next/server";

// Define what a single anime looks like
interface Anime {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  genre_ids?: number[];
  vote_average: number;
  first_air_date: string;
}

// Define what TMDB API returns
interface TMDBResponse {
  results: Anime[];
}

export async function GET() {
  const apiKey =
    process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // Check if API key exists
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TMDB_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  // Fetch anime (animated TV shows) from TMDB
  try {
    // Build the TMDB API URL for anime - only animation genre (genre ID 16)
    const tmdbUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&sort_by=popularity.desc&vote_count.gte=50&with_genres=16&with_original_language=ja&page=1`;

    // Make the request to TMDB
    const response = await fetch(tmdbUrl, {
      headers: { accept: "application/json" },
      cache: "no-store", // Don't cache - always get fresh data
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `TMDB API error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    // Parse the JSON response from TMDB
    const data = (await response.json()) as TMDBResponse;

    // Get the results (already filtered by TMDB to show only Japanese animation)
    const allResults = Array.isArray(data?.results) ? data.results : [];

    // Clean up the data - only send what we need
    const cleanedAnime = allResults.map((show) => ({
      id: show.id,
      name: show.name,
      original_name: show.original_name,
      overview: show.overview,
      backdrop_path: show.backdrop_path,
      poster_path: show.poster_path,
      genre_ids: show.genre_ids,
      vote_average: show.vote_average,
      first_air_date: show.first_air_date,
    }));

    // Send the cleaned data back to the frontend
    return NextResponse.json({ results: cleanedAnime });
  } catch (error: any) {
    // Handle any unexpected errors
    return NextResponse.json(
      { error: error?.message || "Something went wrong fetching anime" },
      { status: 500 }
    );
  }
}
