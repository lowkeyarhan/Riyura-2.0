import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const genreMap: { [key: string]: number } = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Sci-Fi": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

export async function GET(request: Request) {
  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "Missing TMDB_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const mediaType = searchParams.get("mediaType") || "movie";
  const genres = searchParams.get("genres"); // Comma-separated genre names

  let genreIds = "";
  if (genres) {
    genreIds = genres
      .split(",")
      .map((genreName) => genreMap[genreName.trim()])
      .filter(Boolean)
      .join(",");
  }

  const endpoint =
    mediaType === "all"
      ? `/discover/movie?include_adult=false&language=en-US&page=${page}&sort_by=popularity.desc`
      : `/discover/${mediaType}?include_adult=false&language=en-US&page=${page}&sort_by=popularity.desc`;

  let url = `${BASE_URL}${endpoint}&api_key=${TMDB_API_KEY}`;

  if (genreIds) {
    url += `&with_genres=${genreIds}`;
  }

  // Special handling for 'all' to fetch both movies and tv shows
  try {
    if (mediaType === "all") {
      const movieUrl = `${BASE_URL}/discover/movie?include_adult=false&language=en-US&page=${page}&sort_by=popularity.desc&api_key=${TMDB_API_KEY}${
        genreIds ? `&with_genres=${genreIds}` : ""
      }`;
      const tvUrl = `${BASE_URL}/discover/tv?include_adult=false&language=en-US&page=${page}&sort_by=popularity.desc&api_key=${TMDB_API_KEY}${
        genreIds ? `&with_genres=${genreIds}` : ""
      }`;

      const [movieResponse, tvResponse] = await Promise.all([
        fetch(movieUrl),
        fetch(tvUrl),
      ]);

      if (!movieResponse.ok || !tvResponse.ok) {
        throw new Error("Failed to fetch data from TMDB");
      }

      const movieData = await movieResponse.json();
      const tvData = await tvResponse.json();

      // Add a 'media_type' to each result
      const movies = movieData.results.map((item: any) => ({
        ...item,
        media_type: "movie",
      }));
      const tvs = tvData.results.map((item: any) => ({
        ...item,
        media_type: "tv",
      }));

      // Intersperse movies and tv shows for variety
      const combined = [];
      const minLength = Math.min(movies.length, tvs.length);
      for (let i = 0; i < minLength; i++) {
        combined.push(movies[i]);
        combined.push(tvs[i]);
      }
      combined.push(...movies.slice(minLength));
      combined.push(...tvs.slice(minLength));

      return NextResponse.json({
        page: parseInt(page),
        results: combined.slice(0, 20), // Limit to 20 results per page
        total_pages: Math.max(movieData.total_pages, tvData.total_pages),
        total_results: movieData.total_results + tvData.total_results,
      });
    } else {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("TMDB API Error:", errorData);
        throw new Error(
          `Failed to fetch data from TMDB: ${errorData.status_message}`
        );
      }
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
