"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import { ensureUserProfile } from "@/src/lib/database";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing authentication...");
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
          setStatus(`Error: ${sessionError.message}`);
          setTimeout(() => router.push("/auth"), 3000);
          return;
        }

        if (!session) {
          setStatus("No session found. Redirecting to sign in...");
          setTimeout(() => router.push("/auth"), 2000);
          return;
        }

        // Create user profile
        setStatus("Creating your profile...");

        await ensureUserProfile({
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

        setStatus("Success! Redirecting to home...");

        // Redirect to home
        setTimeout(() => router.push("/home"), 1000);
      } catch (error: any) {
        setStatus(`Error: ${error.message}`);
        setTimeout(() => router.push("/auth"), 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-xl">{status}</p>
      </div>
    </div>
  );
}
