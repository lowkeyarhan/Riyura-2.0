"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/src/components/navbar";
import { useAuth } from "@/src/hooks/useAuth";
import { getWatchlist, removeFromWatchlist } from "@/src/lib/database";
import type { WatchlistItem } from "@/src/lib/database";

type MediaType = "movie" | "tv";

interface Item {
  id: number;
  dbId: number;
  type: MediaType;
  title: string;
  poster: string;
  year?: number;
  rating?: number;
  seasons?: number;
  episodes?: number;
}

const FONT_FAMILY = "Be Vietnam Pro, sans-serif";

const formatYear = (year: number) =>
  new Date(year, 0, 1).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getImageUrl = (posterPath: string | null) =>
  posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : "/placeholder.jpg";

export default function WatchlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<"all" | MediaType>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }

      const cacheKey = `watchlist_${user.id}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          console.log(`✅ Watchlist loaded from cache: ${parsed.length} items`);
          setItems(parsed);
          setLoading(false);
          return;
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        console.log("📋 Building watchlist from database...");
        const watchlistData = await getWatchlist(user.id);
        const formatted: Item[] = watchlistData.map((item) => ({
          id: item.tmdb_id,
          dbId: item.id,
          type: item.media_type,
          title: item.title,
          poster: getImageUrl(item.poster_path),
          year: item.release_date
            ? new Date(item.release_date).getFullYear()
            : undefined,
          rating: item.vote || undefined,
          seasons: item.number_of_seasons || undefined,
          episodes: item.number_of_episodes || undefined,
        }));

        console.log(`✅ Watchlist built: ${formatted.length} items`);
        sessionStorage.setItem(cacheKey, JSON.stringify(formatted));
        setItems(formatted);
      } catch (err) {
        console.error("Error loading watchlist:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, authLoading]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.type === filter)),
    [items, filter]
  );

  const removeItem = async (id: number, type: MediaType) => {
    if (!user) return;

    try {
      await removeFromWatchlist(user.id, id, type);
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      sessionStorage.setItem(`watchlist_${user.id}`, JSON.stringify(updated));
      console.log(`✅ Item removed. Updated cache: ${updated.length} items`);
    } catch (err) {
      console.error("Error removing from watchlist:", err);
    }
  };

  useEffect(() => {
    if (!authLoading && !loading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, loading, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-white text-2xl">Loading watchlist...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-white text-2xl">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="px-8 md:px-16 pt-24 pb-12">
        <div className="mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-4 text-center"
            style={{ fontFamily: FONT_FAMILY }}
          >
            My Watchlist
          </h1>
          <p
            className="text-gray-400 text-center max-w-2xl mx-auto text-lg"
            style={{ fontFamily: FONT_FAMILY }}
          >
            Keep track of movies and TV shows you want to watch
          </p>
        </div>

        <div className="flex justify-center border-b border-white/15 items-center gap-8 mb-12">
          {[
            { id: "all", label: "All" },
            { id: "movie", label: "Movies" },
            { id: "tv", label: "TV Shows" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as "all" | MediaType)}
              className={`flex items-center gap-2 p-4 transition-all duration-300 text-2xl relative ${
                filter === tab.id
                  ? "text-red-500"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{ fontFamily: FONT_FAMILY }}
            >
              <span className="font-semibold">{tab.label}</span>
              {filter === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div
              className="text-white text-2xl mb-4 font-semibold"
              style={{ fontFamily: FONT_FAMILY }}
            >
              Your watchlist is empty
            </div>
            <div
              className="text-gray-400 max-w-md text-lg"
              style={{ fontFamily: FONT_FAMILY }}
            >
              Start exploring trending titles and add them here to keep track of
              what you want to watch
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {visible.map((item) => (
              <div
                key={item.id}
                className="group bg-white/10 rounded-xl flex flex-col h-full overflow-hidden hover:bg-white/15 transition-colors"
              >
                <div
                  className="relative aspect-2/3 overflow-hidden cursor-pointer"
                  onClick={() =>
                    router.push(`/details/${item.type}/${item.id}`)
                  }
                >
                  <Image
                    src={item.poster}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-102 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                </div>

                <div className="flex flex-col flex-grow gap-2 p-3">
                  <h3
                    className="text-white font-semibold text-base leading-tight line-clamp-2"
                    style={{ fontFamily: FONT_FAMILY }}
                  >
                    {item.title}
                  </h3>

                  {item.year && (
                    <div
                      className="text-sm text-gray-400"
                      style={{ fontFamily: FONT_FAMILY }}
                    >
                      {formatYear(item.year)}
                    </div>
                  )}

                  {item.rating && (
                    <div
                      className="text-sm text-white font-semibold"
                      style={{ fontFamily: FONT_FAMILY }}
                    >
                      IMDb {item.rating.toFixed(1)}
                    </div>
                  )}

                  {item.type === "tv" && (item.seasons || item.episodes) && (
                    <div
                      className="flex items-center gap-2 text-sm text-gray-400"
                      style={{ fontFamily: FONT_FAMILY }}
                    >
                      {item.seasons && (
                        <span>
                          {item.seasons} Season{item.seasons > 1 ? "s" : ""}
                        </span>
                      )}
                      {item.seasons && item.episodes && <span>•</span>}
                      {item.episodes && (
                        <span>
                          {item.episodes} Ep{item.episodes > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id, item.type);
                  }}
                  className="m-3 mt-0 py-2.5 rounded-lg bg-gray-800/50 hover:bg-red-600 text-white font-medium text-sm transition-all duration-300"
                  style={{ fontFamily: FONT_FAMILY }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
