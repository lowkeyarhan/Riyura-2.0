"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Play, Plus, Star, ArrowUp, X } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useNotification } from "@/src/lib/NotificationContext";
import { addToWatchlist } from "@/src/lib/database";

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
  { label: "All", value: "all" },
  { label: "Movies", value: "movie" },
  { label: "TV", value: "tv" },
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
const FilterButton = ({ active, onClick, children, className = "" }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full transition-all text-sm font-medium font-sans ${
      active
        ? "bg-red-500 text-white shadow-lg shadow-red-500/20 scale-105"
        : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
    } ${className}`}
  >
    {children}
  </button>
);

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
    <div className="group relative rounded-2xl bg-white/[0.1] hover:bg-white/[0.08] transition-colors font-sans">
      <div className="relative aspect-[2/3] rounded-t-xl overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute left-3 bottom-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-white font-semibold">
            {item.vote_average?.toFixed(1)}
          </span>
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button
            className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            onClick={() =>
              router.push(
                item.media_type === "movie"
                  ? `/details/movie/${item.id}`
                  : `/details/tvshow/${item.id}`
              )
            }
          >
            <Play className="w-5 h-5 text-white fill-white ml-1" />
          </button>
          <button
            className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/20"
            onClick={() => onAddToWatchlist(item)}
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-white text-base font-semibold truncate group-hover:text-red-500 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-400">{year}</p>
      </div>
    </div>
  );
};

export default function ExplorePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Action"]);
  const [mediaType, setMediaType] = useState("all");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
      console.log("Added to watchlist:", watchlistItem.title);
      addNotification(`${watchlistItem.title} added to watchlist`, "success");
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      addNotification("Failed to add to watchlist", "error");
    }
  };

  // 1. Fetching Logic
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
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
      } catch (error: any) {
        if (error.name !== "AbortError") console.error("Error:", error);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [page, selectedGenres, mediaType]);

  // 2. Infinite Scroll
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
    <div className="min-h-screen bg-[#070910] pt-35 px-8 md:px-16 lg:px-20 pb-12">
      {/* --- Filter Section --- */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="flex flex-wrap justify-center gap-3">
          {GENRES.map((genre) => (
            <FilterButton
              key={genre}
              active={selectedGenres.includes(genre)}
              onClick={() => handleGenreToggle(genre)}
            >
              {genre}
            </FilterButton>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
            {MEDIA_TYPES.map(({ label, value }) => (
              <FilterButton
                key={value}
                active={mediaType === value}
                onClick={() => handleTypeChange(value)}
              >
                {label}
              </FilterButton>
            ))}
          </div>

          {selectedGenres.length > 0 && (
            <button
              onClick={() => {
                setPage(1);
                setSelectedGenres([]);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* --- Media Grid --- */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
        {items.map((item, idx) => (
          <MovieCard
            key={`${item.id}-${idx}`}
            item={item}
            user={user}
            onAddToWatchlist={handleAddToWatchlist}
          />
        ))}

        {/* --- Skeleton Loaders (Shows on Initial Load AND Infinite Scroll) --- */}
        {loading &&
          Array.from({ length: 12 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="animate-pulse space-y-3">
              <div className="aspect-[2/3] rounded-xl bg-white/5" />
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
        <div className="text-center text-gray-500 text-sm mt-8 pb-8">
          You've reached the end
        </div>
      )}

      {/* --- Scroll To Top --- */}
      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 backdrop-blur-2xl text-white rounded-full cursor-pointer px-4 py-3 shadow-2xl hover:scale-102 transition-all flex items-center gap-2 font-semibold "
        >
          <ArrowUp size={18} />
          Scroll
        </button>
      )}
    </div>
  );
}
