import { NextResponse } from "next/server";

// Define what a single TV show looks like
interface TVShow {
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

interface TMDBResponse {
  results: TVShow[];
}

export async function GET() {
  console.log("📺 Trending TV shows API called");
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TMDB_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  try {
    console.log("🌐 Fetching fresh trending TV shows from TMDB");
    // Build the TMDB API URL for TV shows, excluding animation (genre ID 16)
    const tmdbUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&sort_by=popularity.desc&vote_count.gte=100&without_genres=16&page=1`;

    // Make the request to TMDB
    const response = await fetch(tmdbUrl, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `TMDB API error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    // Parse the JSON response from TMDB
    const data = (await response.json()) as TMDBResponse;
    const allResults = Array.isArray(data?.results) ? data.results : [];

    const cleanedTVShows = allResults.map((show) => ({
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

    const responseData = { results: cleanedTVShows };
    console.log("✅ Trending TV shows fetched and returned");
    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Something went wrong fetching TV shows" },
      { status: 500 }
    );
  }
}
