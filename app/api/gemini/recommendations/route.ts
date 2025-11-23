import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptApiKey } from "@/src/lib/encryption";

/**
 * GET /api/gemini/recommendations
 * Generate personalized movie/TV recommendations using Gemini API
 *
 * Security: Decrypts API key server-side only, never exposes it to client
 * The decrypted key is used only for the Gemini API call and immediately discarded
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
      .select("tmdb_id, title, media_type, duration_sec, episode_length")
      .eq("user_id", user.id)
      .order("watched_at", { ascending: false })
      .limit(20);

    if (historyError) {
      console.error(
        `❌ [Gemini Recommendations] History fetch error: ${historyError.message}`
      );
      throw historyError;
    }

    // 3. Fetch watchlist
    const { data: watchlist, error: watchlistError } = await supabase
      .from("watchlist")
      .select("tmdb_id, title, media_type")
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

    // 4. Decrypt API key (in-memory only, scoped to this block)
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

    const prompt = `You are a movie and TV show recommendation expert. Based on the user's viewing history and watchlist, suggest 5 personalized recommendations.

**User's Watch History (most recent):**
${watchedTitles}

**User's Watchlist:**
${watchlistTitles}

Please provide 5 movie or TV show recommendations that match the user's taste. For each recommendation, provide:
1. Title
2. Type (movie or tv)
3. Brief reason why this matches their interests (1 sentence)
4. Genre

Format your response as a JSON array with this structure:
[
  {
    "title": "Example Movie",
    "type": "movie",
    "reason": "Based on your interest in...",
    "genre": "Action, Thriller"
  }
]

Return ONLY the JSON array, no additional text.`;

    console.log(`🤖 [Gemini Recommendations] Calling Gemini API...`);

    // 6. Call Gemini API (key used here and immediately discarded after)
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
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

      console.log(`✅ [Gemini Recommendations] API call successful`);

      // 7. Parse and return recommendations
      try {
        const generatedText =
          geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Extract JSON from response (may have markdown code blocks)
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("No JSON array found in response");
        }

        const recommendations = JSON.parse(jsonMatch[0]);

        console.log(
          `🎬 [Gemini Recommendations] Parsed ${recommendations.length} recommendations`
        );

        return NextResponse.json(
          {
            success: true,
            recommendations,
            generatedAt: new Date().toISOString(),
          },
          { status: 200 }
        );
      } catch (parseError) {
        console.error(
          `❌ [Gemini Recommendations] Failed to parse response: ${
            parseError instanceof Error ? parseError.message : "Unknown error"
          }`
        );

        // Return raw text as fallback
        return NextResponse.json(
          {
            success: true,
            recommendations: [],
            rawResponse:
              geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "",
            generatedAt: new Date().toISOString(),
          },
          { status: 200 }
        );
      }
    } catch (apiError) {
      console.error(
        `❌ [Gemini Recommendations] API call failed: ${
          apiError instanceof Error ? apiError.message : "Unknown error"
        }`
      );

      // Ensure key is cleared even if error occurs
      geminiApiKey = "";

      return NextResponse.json(
        { error: "Failed to connect to Gemini API. Please try again later." },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("🔥 [Gemini Recommendations] Critical error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
