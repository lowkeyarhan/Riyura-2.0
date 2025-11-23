import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  encryptApiKey,
  decryptApiKey,
  getKeyPreview,
  isValidGeminiApiKeyFormat,
} from "@/src/lib/encryption";

/**
 * GET /api/gemini
 * Fetch API key status (whether key exists and preview)
 *
 * Security: Returns only key existence and masked preview, NEVER the full key
 */
export async function GET(req: Request) {
  console.log("📥 [Gemini API] GET request received");

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("⚠️  [Gemini API] Unauthorized: Missing or invalid token");
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
      console.warn("⚠️  [Gemini API] Unauthorized: Invalid user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔍 [Gemini API] Fetching key status for user: ${user.id}`);

    // Fetch key data (only metadata, not decrypted key)
    const { data, error } = await supabase
      .from("gemini_api_keys")
      .select("key_preview, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(`❌ [Gemini API] Database error: ${error.message}`);
      throw error;
    }

    if (!data) {
      console.log(`ℹ️  [Gemini API] No API key found for user: ${user.id}`);
      return NextResponse.json(
        { hasKey: false, keyPreview: null },
        { status: 200 }
      );
    }

    console.log(`✅ [Gemini API] Key found for user: ${user.id}`);
    return NextResponse.json(
      {
        hasKey: true,
        keyPreview: data.key_preview,
        createdAt: data.created_at,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("🔥 [Gemini API] Critical error in GET:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemini
 * Store or update encrypted Gemini API key
 *
 * Security: Encrypts key using AES-256-GCM before storage
 */
export async function POST(req: Request) {
  console.log("📥 [Gemini API] POST request received");

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("⚠️  [Gemini API] Unauthorized: Missing or invalid token");
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
      console.warn("⚠️  [Gemini API] Unauthorized: Invalid user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string") {
      console.warn("⚠️  [Gemini API] Invalid request: Missing API key");
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!isValidGeminiApiKeyFormat(apiKey)) {
      console.warn("⚠️  [Gemini API] Invalid API key format");
      return NextResponse.json(
        {
          error:
            "Invalid Gemini API key format. Key should start with 'AIza' and be 20-100 characters.",
        },
        { status: 400 }
      );
    }

    console.log(`🔐 [Gemini API] Encrypting API key for user: ${user.id}`);

    // Encrypt the API key
    const { encryptedKey, iv, authTag } = encryptApiKey(apiKey);
    const keyPreview = getKeyPreview(apiKey);

    console.log(`💾 [Gemini API] Storing encrypted key for user: ${user.id}`);

    // Check if key already exists
    const { data: existing } = await supabase
      .from("gemini_api_keys")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let result;

    if (existing) {
      // Update existing key
      console.log(`📝 [Gemini API] Updating existing key (ID: ${existing.id})`);
      result = await supabase
        .from("gemini_api_keys")
        .update({
          encrypted_key: encryptedKey,
          iv: iv,
          auth_tag: authTag,
          key_preview: keyPreview,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("key_preview, updated_at")
        .single();
    } else {
      // Insert new key
      console.log(`✨ [Gemini API] Creating new key entry`);
      result = await supabase
        .from("gemini_api_keys")
        .insert({
          user_id: user.id,
          encrypted_key: encryptedKey,
          iv: iv,
          auth_tag: authTag,
          key_preview: keyPreview,
        })
        .select("key_preview, created_at")
        .single();
    }

    if (result.error) {
      console.error(`❌ [Gemini API] Database error: ${result.error.message}`);
      throw result.error;
    }

    console.log(
      `✅ [Gemini API] Successfully saved API key for user: ${user.id}`
    );
    return NextResponse.json(
      {
        success: true,
        keyPreview: result.data.key_preview,
        message: "API key saved successfully",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("🔥 [Gemini API] Critical error in POST:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gemini
 * Delete user's Gemini API key
 *
 * Security: Permanently removes encrypted key from database
 */
export async function DELETE(req: Request) {
  console.log("📥 [Gemini API] DELETE request received");

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("⚠️  [Gemini API] Unauthorized: Missing or invalid token");
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
      console.warn("⚠️  [Gemini API] Unauthorized: Invalid user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🗑️  [Gemini API] Deleting API key for user: ${user.id}`);

    // Delete the key
    const { error } = await supabase
      .from("gemini_api_keys")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error(`❌ [Gemini API] Database error: ${error.message}`);
      throw error;
    }

    console.log(
      `✅ [Gemini API] Successfully deleted API key for user: ${user.id}`
    );
    return NextResponse.json(
      { success: true, message: "API key deleted successfully" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("🔥 [Gemini API] Critical error in DELETE:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
