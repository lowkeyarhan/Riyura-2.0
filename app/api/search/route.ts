import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const type = (searchParams.get("type") || "multi").toLowerCase();

    if (!TMDB_API_KEY) {
      return NextResponse.json(
        { results: [], error: "Missing TMDB_API_KEY" },
        { status: 500 }
      );
    }

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const endpoint =
      type === "movie"
        ? "search/movie"
        : type === "tv"
        ? "search/tv"
        : "search/multi";

    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      q
    )}&include_adult=false&page=1`;

    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { results: [], error: data?.status_message || "TMDB error" },
        { status: res.status }
      );
    }

    let results: any[] = Array.isArray(data?.results) ? data.results : [];
    if (endpoint === "search/multi") {
      results = results.filter(
        (r) => r.media_type === "movie" || r.media_type === "tv"
      );
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (e) {
    console.error("/api/search error", e);
    return NextResponse.json(
      { results: [], error: "Unexpected error" },
      { status: 500 }
    );
  }
}
