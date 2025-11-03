import { NextResponse } from "next/server";

// Define what a single movie looks like
interface Movie {
  id: number;
  title?: string; // For movies
  name?: string; // For TV shows
  original_name?: string; // Original name in native language
  overview: string; // Movie description
  backdrop_path: string; // Background image path
  genre_ids?: number[]; // Array of genre IDs (e.g., [28, 12] for Action, Adventure)
}

// Define what TMDB API returns
interface TMDBResponse {
  results: Movie[];
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

  // STEP 2: Fetch trending movies from TMDB
  try {
    // Build the TMDB API URL
    const tmdbUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`;

    // Make the request to TMDB
    const response = await fetch(tmdbUrl, {
      headers: { accept: "application/json" },
      cache: "no-store", // Don't cache - always get fresh data
    });

    // STEP 3: Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `TMDB API error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    // STEP 4: Parse the JSON response from TMDB
    const data = (await response.json()) as TMDBResponse;

    // STEP 5: Clean up the data - only send what we need
    const cleanedMovies = Array.isArray(data?.results)
      ? data.results.map((movie) => ({
          id: movie.id,
          title: movie.title,
          name: movie.name,
          original_name: movie.original_name,
          overview: movie.overview,
          backdrop_path: movie.backdrop_path,
          genre_ids: movie.genre_ids,
        }))
      : [];

    // STEP 6: Send the cleaned data back to the frontend
    return NextResponse.json({ results: cleanedMovies });
  } catch (error: any) {
    // STEP 7: Handle any unexpected errors
    return NextResponse.json(
      { error: error?.message || "Something went wrong fetching movies" },
      { status: 500 }
    );
  }
}
