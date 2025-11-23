import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptApiKey } from "@/src/lib/encryption";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// --- Interfaces ---

interface GeminiItem {
  title: string;
  type: "movie" | "tv" | "anime";
  reason: string;
  genre: string;
}

interface ProcessedRecommendation {
  tmdb_id: number;
  title: string;
  media_type: "movie" | "tv";
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string | null;
  number_of_seasons: number | null;
  reason: string;
  genre: string;
}

// --- Helper Functions ---

/**
 * Generates the prompt string using the ORIGINAL System Prompt
 */
function buildGeminiPrompt(history: any[], watchlist: any[]): string {
  const watchedTitles =
    history.map((i) => `${i.title} (${i.media_type})`).join(", ") || "None";
  const watchlistTitles =
    watchlist.map((i) => `${i.title} (${i.media_type})`).join(", ") || "None";

  return `You are an elite cinematic curator and recommendation engine, capable of deep psychographic analysis of media consumption. Your goal is to provide highly personalized, non-generic recommendations by analyzing the "DNA" (pacing, tone, visual style, narrative complexity) of the user's viewing history and watchlist.

**INPUT DATA:**
User Watch History: ${watchedTitles}
User Watchlist: ${watchlistTitles}

**ANALYSIS PROTOCOL:**
1. **Pattern Recognition:** Identify distinct clusters in the user's taste (e.g., "Dark Psychological Thrillers," "Feel-good Slice of Life," "Hard Scifi").
2. **Bridge Strategy:** Do not just match genres. Match *elements*. If they watched "Inception," don't just recommend "Sci-Fi"; recommend movies with "unreliable narrators" or "dream logic."
3. **Novelty vs. Comfort:** Balance high-fidelity matches (very similar to history) with high-quality adjacencies (expanding their horizon).

**CATEGORY DEFINITIONS (STRICT):**
- **Movie:** Feature-length films (Live action or animated).
- **TV:** Live-action series or Western animation (e.g., Arcane, Rick and Morty). NOT Anime.
- **Anime:** Strictly Japanese animation series (Ovas/Series).

**OUTPUT REQUIREMENTS:**
Generate EXACTLY 12 recommendations divided strictly as follows:
- 4 Movies
- 4 Regular TV Shows
- 4 Anime TV Shows

**FORMATTING RULES:**
- **Title:** Must match the official TMDB/IMDb listing.
- **Reason:** Must be hyper-specific and relatable. Avoid generic phrases like "Since you like action." Instead, use: "Since you enjoyed the slow-burn tension of [Insert Watched Title], you will love the atmospheric dread in this."
- **Genre:** Primary 2-3 genres.
- Return ONLY the JSON array with exactly 12 items (4 movies, 4 tv shows, 4 anime), no additional text.

**JSON STRUCTURE:**
[
  {
    "title": "String",
    "type": "movie",
    "reason": "String (Specific connection to user's history)",
    "genre": "String"
  },
  ... (repeat for all 12 items)
]

Return ONLY the JSON array with exactly 12 items (4 movies, 4 tv shows, 4 anime), no additional text.`;
}

/**
 * Search TMDB for a specific title and format the result
 */
async function fetchTmdbData(
  item: GeminiItem
): Promise<ProcessedRecommendation | null> {
  try {
    // TMDB classifies Anime as TV
    const searchType = item.type === "anime" ? "tv" : item.type;
    const url = `https://api.themoviedb.org/3/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      item.title
    )}`;

    const res = await fetch(url);
    const data = await res.json();
    const result = data.results?.[0];

    if (!result) {
      console.warn(`⚠️ [TMDB] No match found for: ${item.title}`);
      return null;
    }

    // Fetch extra details for TV shows (Seasons count)
    let seasons = null;
    if (searchType === "tv") {
      const detailsRes = await fetch(
        `https://api.themoviedb.org/3/tv/${result.id}?api_key=${TMDB_API_KEY}`
      );
      if (detailsRes.ok) {
        const details = await detailsRes.json();
        seasons = details.number_of_seasons;
      }
    }

    return {
      tmdb_id: result.id,
      title: result.title || result.name || item.title,
      media_type: item.type === "anime" ? "tv" : (item.type as "movie" | "tv"),
      poster_path: result.poster_path,
      backdrop_path: result.backdrop_path,
      vote_average: result.vote_average,
      release_date: result.release_date || result.first_air_date || null,
      number_of_seasons: seasons,
      reason: item.reason,
      genre: item.genre,
    };
  } catch (error) {
    console.error(`❌ [TMDB] Error fetching ${item.title}:`, error);
    return null;
  }
}

// --- Main API Route ---

export async function GET(req: Request) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });

    console.log(`🔍 [Gemini] Fetching data for user: ${user.id}`);

    // 2. Parallel Data Fetching (Optimized)
    const [keyRes, historyRes, watchlistRes] = await Promise.all([
      supabase
        .from("gemini_api_keys")
        .select("encrypted_key, iv, auth_tag")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("watch_history")
        .select("title, media_type")
        .eq("user_id", user.id)
        .limit(15),
      supabase
        .from("watchlist")
        .select("title, media_type")
        .eq("user_id", user.id)
        .limit(10),
    ]);

    if (keyRes.error || !keyRes.data) {
      return NextResponse.json(
        { error: "Gemini API key not found in settings." },
        { status: 400 }
      );
    }

    // 3. Decrypt API Key
    let geminiApiKey = "";
    try {
      geminiApiKey = decryptApiKey(
        keyRes.data.encrypted_key,
        keyRes.data.iv,
        keyRes.data.auth_tag
      );
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to decrypt API key." },
        { status: 500 }
      );
    }

    // 4. Call Gemini AI
    const prompt = buildGeminiPrompt(
      historyRes.data || [],
      watchlistRes.data || []
    );
    console.log("🤖 [Gemini] Calling AI Model...");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    // Clear key from memory immediately
    geminiApiKey = "";

    if (!geminiRes.ok) {
      console.error(`❌ [Gemini] API Error: ${geminiRes.status}`);
      return NextResponse.json(
        { error: "AI Service Unavailable" },
        { status: 500 }
      );
    }

    // 5. Parse Gemini Response
    const geminiData = await geminiRes.json();
    const textResponse =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from potential Markdown formatting
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid JSON format from AI");

    const geminiRecommendations: GeminiItem[] = JSON.parse(jsonMatch[0]);

    console.log(
      `🎬 [Gemini] Received ${geminiRecommendations.length} recommendations. Fetching TMDB details...`
    );

    // 6. TMDB Enrichment (Sequential to avoid ECONNRESET)
    const validResults: ProcessedRecommendation[] = [];

    for (const rec of geminiRecommendations) {
      const data = await fetchTmdbData(rec);
      if (data) validResults.push(data);
    }

    console.log(`✅ [Success] Returned ${validResults.length} recommendations`);

    return NextResponse.json({
      success: true,
      recommendations: validResults,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("🔥 [Critical Error]", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
