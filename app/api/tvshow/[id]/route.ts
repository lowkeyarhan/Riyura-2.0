import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey =
    process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TMDB_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  try {
    const { id: tvShowId } = await params;

    // Fetch TV show details, credits, and similar shows in parallel
    const [detailsResponse, creditsResponse, similarResponse] =
      await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/tv/${tvShowId}?api_key=${apiKey}&language=en-US`
        ),
        fetch(
          `https://api.themoviedb.org/3/tv/${tvShowId}/credits?api_key=${apiKey}&language=en-US`
        ),
        fetch(
          `https://api.themoviedb.org/3/tv/${tvShowId}/similar?api_key=${apiKey}&language=en-US&page=1`
        ),
      ]);

    if (!detailsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch TV show details" },
        { status: detailsResponse.status }
      );
    }

    const details = await detailsResponse.json();
    const credits = await creditsResponse.json();
    const similar = await similarResponse.json();

    // Combine all data
    const tvShowData = {
      ...details,
      credits,
      similar,
    };

    return NextResponse.json(tvShowData);
  } catch (error) {
    console.error("Error fetching TV show data:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV show data" },
      { status: 500 }
    );
  }
}
