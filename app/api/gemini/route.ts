import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  encryptApiKey,
  getKeyPreview,
  isValidGeminiApiKeyFormat,
} from "@/src/lib/encryption";

/**
 * Handles Supabase authentication and client initialization
 * Returns the client and user, or null if unauthorized
 */
async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

/**
 * GET /api/gemini
 * Returns key preview if it exists
 */
export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { supabase, user } = auth;
    console.log(`🔍 [Gemini API] Fetching status for user: ${user.id}`);

    const { data, error } = await supabase
      .from("gemini_api_keys")
      .select("key_preview, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ hasKey: false, keyPreview: null });
    }

    return NextResponse.json({
      hasKey: true,
      keyPreview: data.key_preview,
      createdAt: data.created_at,
    });
  } catch (err: any) {
    console.error("🔥 [Gemini API] GET Error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemini
 * Encrypts and Upserts the API Key
 */
export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { supabase, user } = auth;
    const body = await req.json();

    // 1. Validation
    if (!body.apiKey)
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    if (!isValidGeminiApiKeyFormat(body.apiKey)) {
      return NextResponse.json(
        { error: "Invalid API key format. Must start with 'AIza'." },
        { status: 400 }
      );
    }

    // 2. Encryption
    console.log(`🔐 [Gemini API] Encrypting key for user: ${user.id}`);
    const { encryptedKey, iv, authTag } = encryptApiKey(body.apiKey);
    const keyPreview = getKeyPreview(body.apiKey);

    // 3. Check for existing key to determine operation (Update vs Insert)
    const { data: existing } = await supabase
      .from("gemini_api_keys")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let result;
    const payload = {
      user_id: user.id,
      encrypted_key: encryptedKey,
      iv,
      auth_tag: authTag,
      key_preview: keyPreview,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      console.log(`📝 [Gemini API] Updating existing key ID: ${existing.id}`);
      result = await supabase
        .from("gemini_api_keys")
        .update(payload)
        .eq("id", existing.id)
        .select("key_preview")
        .single();
    } else {
      console.log(`✨ [Gemini API] Inserting new key`);
      result = await supabase
        .from("gemini_api_keys")
        .insert(payload)
        .select("key_preview")
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({
      success: true,
      keyPreview: result.data.key_preview,
      message: "API key saved successfully",
    });
  } catch (err: any) {
    console.error("🔥 [Gemini API] POST Error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gemini
 * Removes the key from the database
 */
export async function DELETE(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { supabase, user } = auth;
    console.log(`🗑️  [Gemini API] Deleting key for user: ${user.id}`);

    const { error } = await supabase
      .from("gemini_api_keys")
      .delete()
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (err: any) {
    console.error("🔥 [Gemini API] DELETE Error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
