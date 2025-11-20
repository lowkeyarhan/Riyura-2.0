"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import Navbar from "@/src/components/navbar";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = Boolean(
    pathname === "/" ||
      pathname?.startsWith("/landing") ||
      pathname?.startsWith("/auth")
  );

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublic) {
        router.replace("/auth");
      } else if (user && isPublic) {
        router.replace("/home");
      }
    }
  }, [loading, user, isPublic, router]);

  if (loading) {
    // Show loading state while auth is being checked
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ backgroundColor: "rgb(7, 9, 16)" }}
      >
        <div className="text-white/70 animate-pulse">Loading…</div>
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

  const shouldShowNavbar = !isPublic;

  return shouldShowNavbar ? (
    <>
      <Navbar />
      {children}
    </>
  ) : (
    <>{children}</>
  );
}
