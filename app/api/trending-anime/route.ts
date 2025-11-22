import { NextResponse } from "next/server";

// Define what a single anime looks like
interface Anime {
  id: number;
  name?: string;
  title?: string;
  original_name?: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  genre_ids?: number[];
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  media_type?: string;
}

// Define what TMDB API returns
interface TMDBResponse {
  results: Anime[];
}

export async function GET() {
  console.log("🎌 Trending anime API called");
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TMDB_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  try {
    console.log("🌐 Fetching fresh trending anime from TMDB");
    // Fetch both TV shows and movies with animation genre
    const [tvResponse, movieResponse] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&sort_by=popularity.desc&vote_count.gte=50&with_genres=16&with_original_language=ja&page=1`,
        {
          headers: { accept: "application/json" },
          next: { revalidate: 3600 },
        }
      ),
      fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&sort_by=popularity.desc&vote_count.gte=50&with_genres=16&with_original_language=ja&page=1`,
        {
          headers: { accept: "application/json" },
          next: { revalidate: 3600 },
        }
      ),
    ]);

    // Check if the requests were successful
    if (!tvResponse.ok || !movieResponse.ok) {
      return NextResponse.json({ error: `TMDB API error` }, { status: 500 });
    }

    // Parse the JSON responses from TMDB
    const tvData = (await tvResponse.json()) as TMDBResponse;
    const movieData = (await movieResponse.json()) as TMDBResponse;

    // Get the results and add media_type
    const tvResults = Array.isArray(tvData?.results)
      ? tvData.results.map((item) => ({ ...item, media_type: "tv" }))
      : [];
    const movieResults = Array.isArray(movieData?.results)
      ? movieData.results.map((item) => ({ ...item, media_type: "movie" }))
      : [];

    // Combine and sort by popularity
    const allResults = [...tvResults, ...movieResults].sort(
      (a, b) => b.vote_average - a.vote_average
    );

    // Clean up the data - only send what we need
    const cleanedAnime = allResults.slice(0, 20).map((show) => ({
      id: show.id,
      name: show.name || show.title,
      original_name: show.original_name,
      overview: show.overview,
      backdrop_path: show.backdrop_path,
      poster_path: show.poster_path,
      genre_ids: show.genre_ids,
      vote_average: show.vote_average,
      first_air_date: show.first_air_date,
      release_date: show.release_date,
      media_type: show.media_type,
    }));

    const responseData = { results: cleanedAnime };
    console.log("✅ Trending anime fetched and returned");
    return NextResponse.json(responseData);
  } catch (error: any) {
    // Handle any unexpected errors
    return NextResponse.json(
      { error: error?.message || "Something went wrong fetching anime" },
      { status: 500 }
    );
  }
}
