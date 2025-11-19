import { NextRequest, NextResponse } from "next/server";
import { getCachedData, setCachedData } from "@/src/lib/redis";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  try {
    const { id, seasonId } = await params;
    const cacheKey = `tvshow:${id}:season:${seasonId}`;

    console.log(`📺 Season details API called for TV: ${id}, Season: ${seasonId}`);

    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log(`✅ Returning cached season details for TV: ${id}, Season: ${seasonId}`);
      return NextResponse.json(cachedData);
    }

    console.log(`🌐 Fetching fresh season details from TMDB for TV: ${id}, Season: ${seasonId}`);

    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${id}/season/${seasonId}?api_key=${TMDB_API_KEY}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch season details");
    }

    const data = await response.json();
    await setCachedData(cacheKey, data);
    console.log(`✅ Season details cached and returned for TV: ${id}, Season: ${seasonId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching season details:", error);
    return NextResponse.json(
      { error: "Failed to fetch season details" },
      { status: 500 }
    );
  }
}
