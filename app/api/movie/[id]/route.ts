import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing TMDB_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  try {
    const { id: movieId } = await params;

    console.log(`🎬 Movie details API called for ID: ${movieId}`);
    console.log(`🌐 Fetching movie details from TMDB for ID: ${movieId}`);

    // Fetch movie details, credits, and similar movies in parallel
    const [detailsResponse, creditsResponse, similarResponse] =
      await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`
        ),
        fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}&language=en-US`
        ),
        fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${apiKey}&language=en-US&page=1`
        ),
      ]);

    if (!detailsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch movie details" },
        { status: detailsResponse.status }
      );
    }

    const details = await detailsResponse.json();
    const credits = await creditsResponse.json();
    const similar = await similarResponse.json();

    // Combine all data
    const movieData = {
      ...details,
      credits,
      similar,
    };

    console.log(`✅ Movie details fetched and returned for ID: ${movieId}`);
    return NextResponse.json(movieData);
  } catch (error) {
    console.error("Error fetching movie data:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie data" },
      { status: 500 }
    );
  }
}
