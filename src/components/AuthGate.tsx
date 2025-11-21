"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import Navbar from "@/src/components/navbar";
import LoadingDots from "@/src/components/LoadingDots";
import { supabase } from "@/src/lib/supabase";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = Boolean(
    pathname === "/" ||
      pathname?.startsWith("/landing") ||
      pathname?.startsWith("/auth")
  );

  useEffect(() => {
    const checkOnboarded = async () => {
      if (user) {
        // Fetch profile from supabase
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", user.id)
          .single();
        if (error) {
          setOnboarded(null);
        } else {
          setOnboarded(data?.onboarded ?? null);
        }
      } else {
        setOnboarded(null);
      }
    };
    if (!loading) {
      checkOnboarded();
      if (!user && !isPublic) {
        router.replace("/auth");
      }
    }
  }, [loading, user, isPublic, router]);

  useEffect(() => {
    if (!loading && user && onboarded !== null) {
      if (isPublic) {
        if (!onboarded) {
          router.replace("/onboarding");
        } else {
          router.replace("/home");
        }
      }
    }
  }, [loading, user, onboarded, isPublic, router]);

  if (loading) {
    // Show loading state while auth is being checked
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ backgroundColor: "rgb(7, 9, 16)" }}
      >
        <div className="flex flex-col items-center">
          <LoadingDots />
        </div>
      </div>
    );
  }

  if (!user && !isPublic) {
    // User not logged in and accessing protected page - show redirect message
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ backgroundColor: "rgb(7, 9, 16)" }}
      >
        <div className="text-white/70 animate-pulse">Redirecting…</div>
      </div>
    );
  }

  const shouldShowNavbar = !isPublic && pathname !== "/onboarding";

  return shouldShowNavbar ? (
    <>
      <Navbar />
      {children}
    </>
  ) : (
    <>{children}</>
  );
}
