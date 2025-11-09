"use client";

import Navbar from "@/src/components/navbar";
import Image from "next/image";
import { useAuth } from "@/src/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/src/lib/firebase";

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/landing");
  };

  if (loading || !user) {
    return (
      <div
        className="min-h-screen grid place-items-center text-white"
        style={{ backgroundColor: "rgb(7, 9, 16)" }}
      >
        <div className="animate-pulse text-white/70">Loading profile…</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundColor: "rgb(7, 9, 16)",
        fontFamily: "Be Vietnam Pro, sans-serif",
      }}
    >
      <Navbar />

      <main className="px-6 sm:px-10 lg:px-16 pt-24 pb-16 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <p className="text-white/60">Manage your account and watchlist</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-sm font-semibold"
          >
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Profile card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/10">
                  <Image
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=60"
                    alt="Avatar"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {user.displayName || "User"}
                  </h3>
                  <p className="text-white/60 text-sm">{user.email}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                {["Watchlist", "Watched", "Reviews"].map((label, i) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="text-2xl font-bold">{[12, 34, 0][i]}</div>
                    <div className="text-xs text-white/60">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account settings stub */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6">
              <h3 className="text-lg font-semibold mb-4">Account</h3>
              <div className="space-y-3">
                {[
                  "Change email",
                  "Update password",
                  "Notification preferences",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <span className="text-sm">{item}</span>
                    <button className="text-red-400 hover:text-red-300 text-sm font-medium">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right (spans 2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Watchlist placeholder */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Watchlist</h3>
                <button className="text-sm text-white/70 hover:text-white">
                  View all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-[2/3] rounded-xl border border-white/10 bg-white/[0.06]"
                  />
                ))}
              </div>
            </div>

            {/* Continue watching placeholder */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Continue Watching</h3>
                <button className="text-sm text-white/70 hover:text-white">
                  View all
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/10 bg-white/[0.06] p-4"
                  >
                    <div className="h-40 rounded-lg bg-black/40 mb-3" />
                    <div className="h-3 w-3/4 bg-white/20 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
