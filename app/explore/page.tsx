"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Play,
  Plus,
  Star,
  ArrowUp,
  X,
  Film,
  Tv,
  Sparkles,
  Filter,
} from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useNotification } from "@/src/lib/NotificationContext";
import { addToWatchlist } from "@/src/lib/database";
import { motion, AnimatePresence } from "framer-motion";

// --- Constants ---
const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
];

const MEDIA_TYPES = [
  { label: "All", value: "all", icon: Sparkles },
  { label: "Movies", value: "movie", icon: Film },
  { label: "TV Series", value: "tv", icon: Tv },
];

// --- Types ---
interface MediaItem {
  id: number;
  title: string;
  name?: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
}

// --- Sub-Components ---
const MovieCard = ({
  item,
  user,
  onAddToWatchlist,
}: {
  item: MediaItem;
  user: any;
  onAddToWatchlist: (item: MediaItem) => void;
}) => {
  const router = useRouter();
  const title = item.title || item.name || "Unknown";
  const year = (item.release_date || item.first_air_date)?.substring(0, 4);
  const imageUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : "/placeholder.jpg";

  return (
    <div className="group relative rounded-2xl bg-[#151821] border border-white/5 hover:border-white/20 transition-all duration-300 font-sans shadow-lg">
      <div className="relative aspect-[2/3] rounded-t-xl overflow-hidden bg-[#0f1115]">
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority={true}
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105 blur-0 filter-none"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#151821] via-[#151821]/60 to-transparent" />

        <div className="absolute left-3 bottom-3 flex items-center gap-1 px-2 py-1 rounded-md bg-[#0f1115]/90 border border-white/10 shadow-sm z-10">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-white font-semibold">
            {item.vote_average?.toFixed(1)}
          </span>
        </div>

        <div className="absolute inset-0 bg-[#0f1115]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-20">
          <button
            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            onClick={() =>
              router.push(
                item.media_type === "movie"
                  ? `/details/movie/${item.id}`
                  : `/details/tvshow/${item.id}`
              )
            }
          >
            <Play className="w-4 h-4 fill-black ml-0.5" />
          </button>
          <button
            className="w-10 h-10 border border-white/30 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            onClick={() => onAddToWatchlist(item)}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-2 sm:p-3">
        <h3 className="text-white text-xs sm:text-sm md:text-base font-semibold truncate group-hover:text-orange-500 transition-colors">
          {title}
        </h3>
        <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">
          {year}
        </p>
      </div>
    </div>
  );
};

export default function ExplorePage() {
  const EXPLORE_CACHE_KEY = "exploreDefaultCache";
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Action"]);
  const [mediaType, setMediaType] = useState("all");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // --- Logic Handlers (Unchanged) ---
  const handleAddToWatchlist = async (item: MediaItem) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    try {
      const watchlistItem = {
        tmdb_id: item.id,
        title: item.title || item.name || "Unknown",
        media_type: (item.media_type || "movie") as "movie" | "tv",
        poster_path: item.poster_path,
        release_date: item.release_date || item.first_air_date || null,
        vote: item.vote_average,
      };
      await addToWatchlist(user.id, watchlistItem);
      addNotification(`${watchlistItem.title} added to watchlist`, "success");
    } catch (error) {
      addNotification("Failed to add to watchlist", "error");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      const isDefault =
        page === 1 &&
        selectedGenres.length === 1 &&
        selectedGenres[0] === "Action" &&
        mediaType === "all";

      if (isDefault) {
        const cached = sessionStorage.getItem(EXPLORE_CACHE_KEY);
        if (cached) {
          try {
            const {
              results,
              page: cachedPage,
              total_pages,
            } = JSON.parse(cached);
            setItems(results);
            setHasMore(cachedPage < total_pages);
            setLoading(false);
            return;
          } catch (e) {
            sessionStorage.removeItem(EXPLORE_CACHE_KEY);
          }
        }
      }

      try {
        const genreParams = selectedGenres.join(",");
        const url = `/api/explore?page=${page}&genres=${genreParams}&mediaType=${mediaType}`;
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();

        setItems((prev) =>
          page === 1 ? data.results : [...prev, ...data.results]
        );
        setHasMore(data.page < data.total_pages);

        if (isDefault && page === 1) {
          sessionStorage.setItem(EXPLORE_CACHE_KEY, JSON.stringify(data));
        }
      } catch (error: any) {
        if (error.name !== "AbortError") console.error(error);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [page, selectedGenres, mediaType]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGenreToggle = (genre: string) => {
    setPage(1);
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleTypeChange = (type: string) => {
    setPage(1);
    setMediaType(type);
  };

  return (
    <div className="relative min-h-screen bg-black pt-20 md:pt-28 px-4 sm:px-6 md:px-16 lg:px-16 pb-20 md:pb-12 font-sans">
      {/* --- STATIC BACKGROUND LAYER  --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#155f75b5] blur-[130px] opacity-40" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#9a341299] blur-[130px] opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)]" />
      </div>

      <div className="relative z-10">
        {/* --- HERO SECTION (Matching Aesthetics) --- */}
        <div className="flex flex-col gap-6 md:gap-8 mb-8 md:mb-12">
          {/* 1. Heading */}
          <div className="text-center">
            <h1
              className="text-3xl sm:text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 tracking-tight mb-2"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Explore Universe
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg">
              Dive into millions of movies and TV shows.
            </p>
          </div>

          {/* 2. Unified Control Bar (Sticky, Fake Glass) */}
          <div className="sticky top-16 md:top-24 z-30 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-2 md:p-1 rounded-xl md:rounded-2xl bg-[#1518215f] backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* Left: Media Type Switcher */}
            <div className="flex p-1 rounded-xl md:rounded-2xl relative w-full md:w-auto">
              {MEDIA_TYPES.map((type) => {
                const isActive = mediaType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleTypeChange(type.value)}
                    className={`relative cursor-pointer flex items-center justify-center gap-2 px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 flex-1 md:flex-initial ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeMediaType"
                        className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 md:bg-[#1f232e3f] rounded-lg md:rounded-xl border border-white/10 shadow-sm -z-10"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <type.icon className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">{type.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider (Desktop only) */}
            <div className="hidden md:block w-px h-8 bg-white/10 mx-2" />

            {/* Right: Horizontal Genre Scroll */}
            <div className="relative bg-transparent flex-1 w-full overflow-hidden group/scroll">
              {/* Scroll Container */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-1 md:px-2 py-1 w-full relative">
                {/* Filter Label */}
                <div className="hidden md:flex items-center gap-1.5 md:gap-2 text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 border-r border-white/10 mr-1 md:mr-2 flex-shrink-0">
                  <Filter className="w-3 h-3" />
                  <span className="hidden sm:inline">Genre</span>
                </div>

                {GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      onClick={() => handleGenreToggle(genre)}
                      className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium cursor-pointer transition-all border touch-manipulation ${
                        isSelected
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear Filters Button (Visible if any genre other than 'Action' is selected) */}
            {selectedGenres.some((g) => g !== "Action") && (
              <div className="w-full flex justify-center items-center md:w-auto md:justify-start md:items-start">
                <button
                  onClick={() => {
                    setPage(1);
                    setSelectedGenres(["Action"]);
                  }}
                  className="flex items-center justify-center gap-2 px-4 md:px-0 md:w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 touch-manipulation"
                  title="Reset Filters"
                >
                  <X className="w-4 h-4" />
                  <span className="md:hidden text-sm font-medium">Clear</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Media Grid --- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {items.map((item, idx) => (
            <MovieCard
              key={`${item.id}-${idx}`}
              item={item}
              user={user}
              onAddToWatchlist={handleAddToWatchlist}
            />
          ))}

          {/* --- REVERTED SKELETON ANIMATION (Original Style) --- */}
          {loading &&
            Array.from({ length: 12 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="animate-pulse space-y-3">
                <div className="aspect-[2/3] rounded-xl bg-white/5 border border-white/5" />
                <div className="space-y-2 px-1">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                </div>
              </div>
            ))}
        </div>

        {/* --- Infinite Scroll Trigger --- */}
        <div ref={loadMoreRef} className="h-10 w-full mt-8" />

        {!hasMore && items.length > 0 && (
          <div className="text-center text-white/40 text-sm mt-8 pb-8">
            You've reached the end
          </div>
        )}

        {/* --- Scroll To Top --- */}
        {showTopBtn && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 backdrop-blur-2xl bg-white/10 hover:bg-white text-white hover:text-black rounded-full cursor-pointer px-4 sm:px-5 py-2.5 sm:py-3 shadow-2xl transition-all flex items-center gap-2 font-bold text-xs sm:text-sm touch-manipulation"
          >
            <ArrowUp size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Scroll</span>
          </button>
        )}
      </div>
    </div>
  );
}
