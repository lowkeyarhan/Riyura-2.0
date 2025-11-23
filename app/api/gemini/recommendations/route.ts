import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptApiKey } from "@/src/lib/encryption";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

interface GeminiRecommendation {
  title: string;
  type: "movie" | "tv" | "anime";
  reason: string;
  genre: string;
}

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  number_of_seasons?: number;
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

/**
 * Search TMDB for a title and return the best match with full details
 */
async function searchTMDB(
  title: string,
  type: "movie" | "tv" | "anime"
): Promise<TMDBSearchResult | null> {
  try {
    // For anime, search TV shows
    const searchType = type === "anime" ? "tv" : type;
    const url = `https://api.themoviedb.org/3/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      title
    )}&page=1`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `❌ [TMDB Search] Failed for "${title}": ${response.status}`
      );
      return null;
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      console.warn(`⚠️  [TMDB Search] No results found for "${title}"`);
      return null;
    }

    const result = data.results[0];

    // For TV shows, fetch full details to get number of seasons
    if (searchType === "tv") {
      try {
        const detailsUrl = `https://api.themoviedb.org/3/tv/${result.id}?api_key=${TMDB_API_KEY}`;
        const detailsResponse = await fetch(detailsUrl);

        if (detailsResponse.ok) {
          const details = await detailsResponse.json();
          result.number_of_seasons = details.number_of_seasons;
          console.log(
            `✅ [TMDB Search] Found "${title}": ID ${result.id} (${details.number_of_seasons} seasons)`
          );
        } else {
          console.log(`✅ [TMDB Search] Found "${title}": ID ${result.id}`);
        }
      } catch (error) {
        console.warn(
          `⚠️  [TMDB Search] Failed to fetch details for "${title}"`
        );
        console.log(`✅ [TMDB Search] Found "${title}": ID ${result.id}`);
      }
    } else {
      console.log(`✅ [TMDB Search] Found "${title}": ID ${result.id}`);
    }

    return result;
  } catch (error) {
    console.error(
      `❌ [TMDB Search] Error searching for "${title}":`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

/**
 * GET /api/gemini/recommendations
 * Generate personalized movie/TV/anime recommendations using Gemini AI + TMDB
 *
 * Returns: 2 movies, 2 TV shows, 2 anime recommendations
 */
export async function GET(req: Request) {
  console.log("📥 [Gemini Recommendations] GET request received");

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn(
        "⚠️  [Gemini Recommendations] Unauthorized: Missing or invalid token"
      );
      return NextResponse.json(
        { error: "Missing or Invalid Token" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("⚠️  [Gemini Recommendations] Unauthorized: Invalid user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      `🔍 [Gemini Recommendations] Fetching data for user: ${user.id}`
    );

    // 1. Fetch encrypted API key
    const { data: keyData, error: keyError } = await supabase
      .from("gemini_api_keys")
      .select("encrypted_key, iv, auth_tag")
      .eq("user_id", user.id)
      .maybeSingle();

    if (keyError) {
      console.error(
        `❌ [Gemini Recommendations] Key fetch error: ${keyError.message}`
      );
      throw keyError;
    }

    if (!keyData) {
      console.warn(
        `⚠️  [Gemini Recommendations] No API key found for user: ${user.id}`
      );
      return NextResponse.json(
        {
          error:
            "Gemini API key not configured. Please add your API key in profile settings.",
        },
        { status: 400 }
      );
    }

    // 2. Fetch watch history
    const { data: watchHistory, error: historyError } = await supabase
      .from("watch_history")
      .select("title, media_type")
      .eq("user_id", user.id)
      .order("watched_at", { ascending: false })
      .limit(15);

    if (historyError) {
      console.error(
        `❌ [Gemini Recommendations] History fetch error: ${historyError.message}`
      );
      throw historyError;
    }

    // 3. Fetch watchlist
    const { data: watchlist, error: watchlistError } = await supabase
      .from("watchlist")
      .select("title, media_type")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false })
      .limit(10);

    if (watchlistError) {
      console.error(
        `❌ [Gemini Recommendations] Watchlist fetch error: ${watchlistError.message}`
      );
      throw watchlistError;
    }

    console.log(
      `📊 [Gemini Recommendations] Data fetched: ${
        watchHistory?.length || 0
      } watched, ${watchlist?.length || 0} in watchlist`
    );

    // 4. Decrypt API key (in-memory only)
    let geminiApiKey: string;
    try {
      geminiApiKey = decryptApiKey(
        keyData.encrypted_key,
        keyData.iv,
        keyData.auth_tag
      );
      console.log(`🔓 [Gemini Recommendations] API key decrypted successfully`);
    } catch (decryptError) {
      console.error(
        `❌ [Gemini Recommendations] Decryption failed: ${
          decryptError instanceof Error ? decryptError.message : "Unknown error"
        }`
      );
      return NextResponse.json(
        {
          error:
            "Failed to decrypt API key. Please re-enter your key in profile settings.",
        },
        { status: 500 }
      );
    }

    // 5. Build prompt for Gemini
    const watchedTitles =
      watchHistory
        ?.map((item) => `${item.title} (${item.media_type})`)
        .join(", ") || "None";
    const watchlistTitles =
      watchlist
        ?.map((item) => `${item.title} (${item.media_type})`)
        .join(", ") || "None";

    const prompt = `You are an elite cinematic curator and recommendation engine, capable of deep psychographic analysis of media consumption. Your goal is to provide highly personalized, non-generic recommendations by analyzing the "DNA" (pacing, tone, visual style, narrative complexity) of the user's viewing history and watchlist.

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

    console.log(`🤖 [Gemini Recommendations] Calling Gemini API...`);

    // 6. Call Gemini API
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      // Clear decrypted key from memory immediately
      geminiApiKey = "";

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error(
          `❌ [Gemini Recommendations] Gemini API error (${geminiResponse.status}): ${errorText}`
        );

        if (geminiResponse.status === 400) {
          return NextResponse.json(
            {
              error:
                "Invalid API key or request. Please check your Gemini API key.",
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            error:
              "Failed to generate recommendations. Please try again later.",
          },
          { status: 500 }
        );
      }

      const geminiData = await geminiResponse.json();
      console.log(`✅ [Gemini Recommendations] Gemini API call successful`);

      // 7. Parse Gemini response
      const generatedText =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in Gemini response");
      }

      const geminiRecommendations: GeminiRecommendation[] = JSON.parse(
        jsonMatch[0]
      );

      console.log(
        `🎬 [Gemini Recommendations] Parsed ${geminiRecommendations.length} recommendations from Gemini`
      );

      // 8. Fetch TMDB data for each recommendation
      const processedRecommendations: ProcessedRecommendation[] = [];

      for (const rec of geminiRecommendations) {
        console.log(
          `🔍 [Gemini Recommendations] Searching TMDB for: ${rec.title} (${rec.type})`
        );

        const tmdbResult = await searchTMDB(rec.title, rec.type);

        if (tmdbResult) {
          processedRecommendations.push({
            tmdb_id: tmdbResult.id,
            title: tmdbResult.title || tmdbResult.name || rec.title,
            media_type: rec.type === "anime" ? "tv" : rec.type,
            poster_path: tmdbResult.poster_path,
            backdrop_path: tmdbResult.backdrop_path,
            vote_average: tmdbResult.vote_average,
            release_date:
              tmdbResult.release_date || tmdbResult.first_air_date || null,
            number_of_seasons: tmdbResult.number_of_seasons || null,
            reason: rec.reason,
            genre: rec.genre,
          });
        } else {
          console.warn(
            `⚠️  [Gemini Recommendations] Skipping "${rec.title}" (no TMDB match)`
          );
        }
      }

      console.log(
        `✅ [Gemini Recommendations] Successfully processed ${processedRecommendations.length} recommendations with TMDB data`
      );

      return NextResponse.json(
        {
          success: true,
          recommendations: processedRecommendations,
          generatedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (apiError) {
      console.error(
        `❌ [Gemini Recommendations] Error: ${
          apiError instanceof Error ? apiError.message : "Unknown error"
        }`
      );
      console.error(`🔥 [Gemini Recommendations] Full error:`, apiError);

      // Ensure key is cleared even if error occurs
      geminiApiKey = "";

      return NextResponse.json(
        {
          error: "Failed to generate recommendations. Please try again later.",
          debug: apiError instanceof Error ? apiError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("🔥 [Gemini Recommendations] Critical error:", err.message);
    console.error("🔥 [Gemini Recommendations] Stack:", err.stack);
    return NextResponse.json(
      { error: "Internal Server Error", debug: err.message },
      { status: 500 }
    );
  }
}
