"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/src/components/navbar";
import Footer from "@/src/components/footer";
import { useAuth } from "@/src/hooks/useAuth";
import { getWatchlist, removeFromWatchlist } from "@/src/lib/database";
import type { WatchlistItem } from "@/src/lib/database";

type WatchItemType = "movie" | "tv";

interface WatchItem {
  id: number;
  dbId: number; // Database ID for deletion
  type: WatchItemType;
  title: string;
  poster: string;
  year?: number;
  rating?: number;
  seasons?: number;
  episodes?: number;
}

export default function WatchlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [filter, setFilter] = useState<"all" | WatchItemType>("all");
  const [loading, setLoading] = useState(true);

  const CACHE_KEY = `watchlist_${user?.id || "guest"}`;

  // Fetch watchlist from database
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        console.log("🔒 No user logged in");
        setLoading(false);
        return;
      }

      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          console.log(
            "✅ Watchlist loaded from session cache:",
            parsedData.length,
            "items"
          );
          setItems(parsedData);
          setLoading(false);
          return;
        } catch (err) {
          console.log("⚠️ Failed to parse cached watchlist, fetching fresh");
        }
      }

      try {
        console.log(
          "📋 Fetching fresh watchlist from database for user:",
          user.id
        );
        const startTime = performance.now();
        const watchlistData = await getWatchlist(user.id);

        const formattedItems: WatchItem[] = watchlistData.map((item) => ({
          id: item.tmdb_id,
          dbId: item.id,
          type: item.media_type,
          title: item.title,
          poster: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : "/placeholder.jpg",
          year: item.release_date
            ? new Date(item.release_date).getFullYear()
            : undefined,
          rating: item.vote || undefined,
          seasons: item.number_of_seasons || undefined,
          episodes: item.number_of_episodes || undefined,
        }));

        const endTime = performance.now();
        console.log(
          `✅ Watchlist loaded from database: ${
            formattedItems.length
          } items in ${(endTime - startTime).toFixed(0)}ms`
        );

        sessionStorage.setItem(CACHE_KEY, JSON.stringify(formattedItems));
        console.log("💾 Watchlist cached in session storage");
        setItems(formattedItems);
      } catch (err) {
        console.error("❌ Error loading watchlist:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, authLoading, CACHE_KEY]);

  // Filtered items based on selected tab
  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  const removeItem = async (tmdbId: number, mediaType: WatchItemType) => {
    if (!user) {
      console.log("🔒 No user logged in");
      return;
    }

    try {
      console.log("🗑️ Removing item from watchlist:", { tmdbId, mediaType });
      await removeFromWatchlist(user.id, tmdbId, mediaType);

      const updatedItems = items.filter((i) => i.id !== tmdbId);
      setItems(updatedItems);

      sessionStorage.setItem(CACHE_KEY, JSON.stringify(updatedItems));
      console.log("✅ Item removed from watchlist and cache updated");
    } catch (err) {
      console.error("❌ Error removing from watchlist:", err);
    }
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !loading && !user) {
      console.log("🔒 Redirecting to auth page...");
      router.push("/auth");
    }
  }, [user, authLoading, loading, router]);

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-white text-2xl">Loading watchlist...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show loading if redirecting (no user)
  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-white text-2xl">Redirecting...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="px-8 md:px-16 lg:px-16 pt-24 pb-12">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-4 text-center"
            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
          >
            My Watchlist
          </h1>
          <p
            className="text-gray-400 text-center max-w-2xl mx-auto text-lg"
            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
          >
            Keep track of movies and TV shows you want to watch
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center border-b border-white/15 items-center gap-8 mb-12">
          {[
            { key: "all", label: "All" },
            { key: "movie", label: "Movies" },
            { key: "tv", label: "TV Shows" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as "all" | WatchItemType)}
              className={`flex items-center gap-2 p-4 transition-all duration-300 text-2xl relative ${
                filter === tab.key
                  ? "text-red-500"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              <span className="font-semibold">{tab.label}</span>
              {filter === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div
              className="text-white text-2xl mb-4 font-semibold"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Your watchlist is empty
            </div>
            <div
              className="text-gray-400 max-w-md text-lg"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Start exploring trending titles and add them here to keep track of
              what you want to watch
            </div>
          </div>
        )}

        {/* Grid */}
        {visible.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {visible.map((item) => (
              <div
                key={item.id}
                className="group bg-white/[0.1] rounded-xl flex flex-col h-full"
              >
                {/* Poster */}
                <div
                  className="relative aspect-2/3 rounded-t-xl overflow-hidden cursor-pointer"
                  onClick={() =>
                    router.push(`/details/${item.type}/${item.id}`)
                  }
                >
                  <Image
                    src={item.poster || "/placeholder.jpg"}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-102"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                </div>

                {/* Info Section */}
                <div className="flex p-3 flex-col gap-2 flex-grow">
                  {/* Title */}
                  <h3
                    className="text-white font-semibold text-base leading-tight line-clamp-2  transition-colors"
                    style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                  >
                    {item.title}
                  </h3>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    {item.year && (
                      <span
                        style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                      >
                        {new Date(item.year, 0, 1).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Rating and TV Show Info */}
                  <div className="flex flex-col gap-1">
                    {item.rating && (
                      <div className="flex items-center gap-1">
                        <span
                          className="text-white font-semibold text-sm"
                          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                        >
                          IMDb {item.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {item.type === "tv" && (item.seasons || item.episodes) && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        {item.seasons && (
                          <span
                            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                          >
                            {item.seasons} Season{item.seasons > 1 ? "s" : ""}
                          </span>
                        )}
                        {item.seasons && item.episodes && <span>•</span>}
                        {item.episodes && (
                          <span
                            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                          >
                            {item.episodes} Ep{item.episodes > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id, item.type);
                  }}
                  className="m-3 mt-0 w-auto py-2.5 rounded-lg bg-gray-800/50 hover:bg-red-600 text-white font-medium text-sm transition-all duration-300 border border-gray-700/50 hover:border-red-600"
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                  aria-label={`Remove ${item.title} from watchlist`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
