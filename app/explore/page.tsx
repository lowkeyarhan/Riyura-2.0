"use client";

import Navbar from "@/src/components/navbar";

export default function Page() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundColor: "rgb(7, 9, 16)",
        fontFamily: "Be Vietnam Pro, sans-serif",
      }}
    >
      <Navbar />
      <main className="px-6 sm:px-10 lg:px-16 pt-24 pb-16">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8">
          <h1 className="text-3xl font-bold mb-2">Explore</h1>
          <p className="text-white/70">
            This section is coming soon. In the meantime, use Search to discover
            movies and TV shows.
          </p>
        </div>
      </main>
    </div>
  );
}
