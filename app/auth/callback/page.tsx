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
        // Wait a moment for the session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 1000));

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

        console.log("✅ Session established for user:", session.user.id);

        // Wait a bit more for the database trigger to create the profile
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Fetch the profile (should be created by trigger)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.error("❌ Profile fetch error:", profileError);
          // If profile doesn't exist, try to create it manually
          const manualProfile = await ensureUserProfile({
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

          if (manualProfile && !manualProfile.onboarded) {
            router.replace("/onboarding");
          } else {
            router.replace("/home");
          }
          return;
        }

        console.log("✅ Profile loaded:", profile);

        // Check if user needs onboarding
        if (profile && !profile.onboarded) {
          router.replace("/onboarding");
        } else {
          router.replace("/home");
        }
      } catch (error: any) {
        console.error("❌ Auth callback error:", error);
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
