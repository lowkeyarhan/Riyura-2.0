"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import { ensureUserProfile } from "@/src/lib/database";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React strict mode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        // Get the session from Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setError(`Error: ${sessionError.message}`);
          setTimeout(() => router.push("/auth"), 3000);
          return;
        }

        if (!session) {
          setError("No session found. Redirecting to sign in...");
          setTimeout(() => router.push("/auth"), 2000);
          return;
        }

        // Create user profile silently
        const profile = await ensureUserProfile({
          uid: session.user.id,
          email: session.user.email!,
          displayName:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            null,
          photoURL:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            null,
        });

        // Check if user needs onboarding
        if (profile && !profile.onboarded) {
          router.replace("/onboarding");
        } else {
          router.replace("/home");
        }
      } catch (error: any) {
        setError(`Error: ${error.message}`);
        setTimeout(() => router.push("/auth"), 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {error && (
        <div className="text-center">
          <p className="text-xl">{error}</p>
        </div>
      )}
    </div>
  );
}
