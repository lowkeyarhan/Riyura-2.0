import { NextResponse } from "next/server";

interface Movie {
  id: number;
  title?: string;
  name?: string;
  original_name?: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  genre_ids?: number[];
  vote_average: number;
  release_date: string;
}

interface TMDBResponse {
  results: Movie[];
}

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TMDB_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  try {
    const tmdbUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`;

    const response = await fetch(tmdbUrl, {
      headers: { accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `TMDB API error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as TMDBResponse;

    const cleanedMovies = Array.isArray(data?.results)
      ? data.results.map((movie) => ({
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

    return NextResponse.json({ results: cleanedMovies });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Something went wrong fetching movies" },
      { status: 500 }
    );
  }
}
