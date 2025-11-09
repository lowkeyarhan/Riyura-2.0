"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";

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
    if (!loading && !user && !isPublic) {
      router.replace("/auth");
    }
  }, [loading, user, isPublic, router]);

  if (!user && !isPublic) {
    // small guard to avoid flashing protected UI client-side
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ backgroundColor: "rgb(7, 9, 16)" }}
      >
        <div className="text-white/70 animate-pulse">Redirecting…</div>
      </div>
    );
  }

  return <>{children}</>;
}
