import { NextResponse } from "next/server";

interface Movie {
  id: number;
  title?: string; // For movies
  name?: string; // For TV shows
  original_name?: string; // Original name in native language
  overview: string; // Movie description
  backdrop_path: string; // Background image path
  poster_path: string; // Poster image path
  genre_ids?: number[]; // Array of genre IDs (e.g., [28, 12] for Action, Adventure)
  vote_average: number; // Rating score
  release_date: string; // Release date
}

// Define what TMDB API returns
interface TMDBResponse {
  results: Movie[];
}

export async function GET() {
  console.log("🎬 Trending movies API called");
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TMDB_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  try {
    console.log("🌐 Fetching fresh trending movies from TMDB");
    const tmdbUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`;

    const response = await fetch(tmdbUrl, {
      headers: { accept: "application/json" },
      cache: "no-store",
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

    const cleanedMovies = Array.isArray(data?.results)
      ? data.results.slice(0, 6).map((movie) => ({
          id: movie.id,
          title: movie.title,
          name: movie.name,
          original_name: movie.original_name,
          overview: movie.overview,
          backdrop_path: movie.backdrop_path,
          poster_path: movie.poster_path,
          genre_ids: movie.genre_ids,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
        }))
      : [];

    const responseData = { results: cleanedMovies };
    console.log("✅ Trending movies fetched and returned");
    return NextResponse.json(responseData);
  } catch (error: any) {
    // STEP 7: Handle any unexpected errors
    return NextResponse.json(
      { error: error?.message || "Something went wrong fetching movies" },
      { status: 500 }
    );
  }
}
