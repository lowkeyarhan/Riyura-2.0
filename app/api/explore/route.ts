import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const GENRE_MAP: Record<string, number> = {
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
    return NextResponse.json({ error: "API Key missing" }, { status: 500 });
  }

  try {
    // 2. Parse URL Parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const mediaType = searchParams.get("mediaType") || "movie";
    const genreNames = searchParams.get("genres")?.split(",") || [];

    // Convert names (e.g. "Action") to IDs (e.g. 28)
    const genreIds = genreNames
      .map((name) => GENRE_MAP[name.trim()]) // Look up ID
      .filter(Boolean) // Remove undefined/invalid ones
      .join(",");

    // 3. Construct Base Query Params (Used for both Movie & TV fetches)
    const apiParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      include_adult: "false",
      language: "en-US",
      sort_by: "popularity.desc",
      page: page,
      with_genres: genreIds,
    });

    // 4. Scenario A: Fetch "All" (Movies + TV mixed)
    if (mediaType === "all") {
      const [movieRes, tvRes] = await Promise.all([
        fetch(`${BASE_URL}/discover/movie?${apiParams}`),
        fetch(`${BASE_URL}/discover/tv?${apiParams}`),
      ]);

      if (!movieRes.ok || !tvRes.ok) throw new Error("TMDB Fetch Failed");

      const [movies, tv] = await Promise.all([movieRes.json(), tvRes.json()]);
      const combined = [];
      const maxLen = Math.max(movies.results.length, tv.results.length);

      for (let i = 0; i < maxLen; i++) {
        if (movies.results[i])
          combined.push({ ...movies.results[i], media_type: "movie" });
        if (tv.results[i])
          combined.push({ ...tv.results[i], media_type: "tv" });
      }

      return NextResponse.json({
        results: combined.slice(0, 20), // Limit to 20 items per page
        page: parseInt(page),
        total_pages: Math.max(movies.total_pages, tv.total_pages),
      });
    }

    // 5. Scenario B: Fetch Single Type (Movie OR TV)
    const response = await fetch(
      `${BASE_URL}/discover/${mediaType}?${apiParams}`
    );

    if (!response.ok) throw new Error("TMDB Fetch Failed");

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
