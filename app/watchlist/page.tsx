"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Play, Film, Tv, Star, LayoutGrid, List } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { getWatchlist, removeFromWatchlist } from "@/src/lib/database";
import { useNotification } from "@/src/lib/NotificationContext";

// --- Types ---
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

// --- Constants ---
const FONT_FAMILY = "Be Vietnam Pro, sans-serif";

const TABS = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "TV Shows" },
];

// --- Helper Components ---
const FilterButton = ({ active, onClick, children }: any) => (
  <button
    onClick={onClick}
    className={`px-6 py-2.5 rounded-full text-sm md:text-base font-bold uppercase tracking-wider transition-all duration-300 ${
      active
        ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-105"
        : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/10"
    }`}
    style={{ fontFamily: "Montserrat, sans-serif" }}
  >
    {children}
  </button>
);

const WatchlistCard = ({
  item,
  onRemove,
  onClick,
}: {
  item: Item;
  onRemove: (e: React.MouseEvent) => void;
  onClick: () => void;
}) => {
  return (
    <div
      className="group relative rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 font-sans cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={item.poster}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Type Badge (Top Left) */}
        <span className="inline-flex absolute top-3 left-3 items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-slate-200">
          {item.type === "movie" ? (
            <Film className="w-4 h-4" />
          ) : (
            <Tv className="w-4 h-4" />
          )}
          {item.type === "movie" ? "Movie" : "TV"}
        </span>

        {/* Rating Badge (Bottom Left) */}
        {item.rating && (
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-white font-bold">
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2 scale-0 group-hover:scale-100 transition-transform duration-300 delay-75">
            <button
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-102 transition-transform text-black"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Play className="w-5 h-5 ml-1 fill-black" />
            </button>
            <span className="text-xs font-medium text-white tracking-wide">
              Watch
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
            <button
              className="w-12 h-12 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:border-red-600 hover:scale-110 transition-all text-red-500 hover:text-white"
              onClick={onRemove}
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <span className="text-xs font-medium text-red-400 tracking-wide">
              Remove
            </span>
          </div>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4">
        <h3 className="text-white text-lg font-semibold truncate group-hover:text-orange-500 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-400">
            {item.year || "Unknown Year"}
          </span>
          {item.type === "tv" && (item.seasons || item.episodes) && (
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
              {item.seasons ? `${item.seasons} S` : ""}
              {item.seasons && item.episodes ? " • " : ""}
              {item.episodes ? `${item.episodes} Ep` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function WatchlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();

  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<"all" | MediaType>("all");
  const [loading, setLoading] = useState(true);

  // Fetch Data
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
          setItems(JSON.parse(cached));
          setLoading(false);
          return;
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        const watchlistData = await getWatchlist(user.id);
        const formatted: Item[] = watchlistData.map((item) => ({
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

        sessionStorage.setItem(cacheKey, JSON.stringify(formatted));
        setItems(formatted);
      } catch (err) {
        console.error("Error loading watchlist:", err);
        addNotification("Failed to load watchlist", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, authLoading, addNotification]);

  // Filter Logic
  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.type === filter)),
    [items, filter]
  );

  // Remove Logic
  const removeItem = async (
    e: React.MouseEvent,
    id: number,
    type: MediaType
  ) => {
    e.stopPropagation(); // Prevent card click
    if (!user) return;

    // Optimistic update
    const previousItems = [...items];
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    sessionStorage.setItem(`watchlist_${user.id}`, JSON.stringify(updated));

    try {
      await removeFromWatchlist(user.id, id, type);
      addNotification("Removed from watchlist", "success");
    } catch (err) {
      // Revert on fail
      setItems(previousItems);
      addNotification("Failed to remove item", "error");
      console.error("Error removing:", err);
    }
  };

  // Auth Redirect
  useEffect(() => {
    if (!authLoading && !loading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, loading, router]);

  // --- Render ---
  return (
    <div className="relative min-h-screen bg-black font-sans">
      {/* --- BACKGROUND LAYERS (Fixed) --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        {/* 2. Deep Cyan Blob (Top Left) */}
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#155f7577] blur-[130px] opacity-40" />
        {/* 3. Deep Orange Blob (Bottom Right) */}
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#9a34127b] blur-[130px] opacity-30 mix-blend-screen" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)]" />
        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-150 mix-blend-overlay" />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 px-6 md:px-16 lg:px-20 pt-32 pb-12">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-12 text-center">
          <h1
            className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl"
            style={{ fontFamily: FONT_FAMILY }}
          >
            Your Watchlist
          </h1>
          <p
            className="text-gray-400 text-lg max-w-xl"
            style={{ fontFamily: FONT_FAMILY }}
          >
            A personalized collection of movies and shows you want to
            experience.
          </p>
        </div>

        {/* Controls */}
        {!loading && items.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {TABS.map((tab) => (
              <FilterButton
                key={tab.id}
                active={filter === tab.id}
                onClick={() => setFilter(tab.id as "all" | MediaType)}
              >
                {tab.label}
              </FilterButton>
            ))}
          </div>
        )}

        {/* Content Grid */}
        {loading ? (
          // Skeletons
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/5 border border-white/5 aspect-[2/3] animate-pulse relative overflow-hidden"
              >
                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-32 text-center border border-white/5 rounded-3xl bg-white/[0.05] backdrop-blur-sm">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <LayoutGrid className="w-10 h-10 text-gray-500" />
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-3"
              style={{ fontFamily: FONT_FAMILY }}
            >
              {items.length === 0
                ? "Your watchlist is empty"
                : `No ${filter === "movie" ? "movies" : "TV shows"} found`}
            </h2>
            <p className="text-gray-400 text-lg max-w-md px-4">
              {items.length === 0
                ? "Go explore trending titles and bookmark the ones that catch your eye."
                : `You haven't added any ${
                    filter === "movie" ? "movies" : "TV shows"
                  } to your list yet.`}
            </p>
          </div>
        ) : (
          // Results
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {visible.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                onRemove={(e) => removeItem(e, item.id, item.type)}
                onClick={() =>
                  router.push(
                    `/details/${item.type === "movie" ? "movie" : "tvshow"}/${
                      item.id
                    }`
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
