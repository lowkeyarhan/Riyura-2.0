"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Star, Play } from "lucide-react";

// --- Types ---
interface Anime {
  id: number;
  name: string;
  poster_path: string;
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  overview: string;
  media_type?: string;
}

interface AnimeProps {
  currentPage: number;
  itemsPerPage: number;
  onTotalItemsChange: (total: number) => void;
  initialAnime?: Anime[];
}

// --- Constants ---
const CACHE_KEY = "homepage:trending-anime";
const CACHE_DURATION = 15 * 60 * 1000;
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// --- Utils ---
const formatDate = (dateString?: string) => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
};

// --- Sub-Component: Skeleton ---
const AnimeSkeleton = () => (
  <div className="relative aspect-[2/3] rounded-xl bg-[#1a1d29] border border-white/5 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-20 animate-pulse" />
  </div>
);

// --- Sub-Component: Anime Card ---
const AnimeCard = ({
  anime,
  onClick,
}: {
  anime: Anime;
  onClick: () => void;
}) => {
  const date = anime.first_air_date || anime.release_date;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className="
        group relative cursor-pointer rounded-xl overflow-hidden 
        bg-[#151821] 
        border border-white/5 
        hover:border-white/20
        transition-colors duration-300
        shadow-lg
      "
    >
      {/* Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0f1115]">
        <Image
          src={
            anime.poster_path
              ? `${IMAGE_BASE_URL}${anime.poster_path}`
              : "/placeholder.jpg"
          }
          alt={anime.name || "Anime"}
          fill
          priority={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105 blur-0 filter-none"
        />

        {/* HOVER OVERLAY (The Dark Gradient) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-[#0f1115]/90 border border-white/10 shadow-sm z-20">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-white">
            {anime.vote_average.toFixed(1)}
          </span>
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 fill-black ml-1" />
          </div>
        </div>

        {/* TEXT DETAILS (Slide Up Effect) */}
        <div className="absolute bottom-0 inset-x-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <h3 className="text-base font-bold text-white leading-tight mb-1 line-clamp-2">
            {anime.name}
          </h3>

          <div className="flex items-center gap-2 text-xs text-gray-300/90">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(date)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Component ---
export default function Anime({
  currentPage,
  itemsPerPage,
  onTotalItemsChange,
  initialAnime = [],
}: AnimeProps) {
  const router = useRouter();
  const [animeList, setAnimeList] = useState<Anime[]>(initialAnime);
  const [loading, setLoading] = useState(initialAnime.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetching if we have initial data
    if (initialAnime.length > 0) {
      return;
    }

    const fetchAnime = async () => {
      try {
        setLoading(true);
        const cached = localStorage.getItem(CACHE_KEY);

        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setAnimeList(data.results || []);
            setLoading(false);
            return;
          }
        }

        const response = await fetch("/api/trending-anime");
        if (!response.ok) throw new Error("Failed to fetch anime");

        const data = await response.json();
        setAnimeList(data.results || []);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setAnimeList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, []);

  useEffect(() => {
    onTotalItemsChange(animeList.length);
  }, [animeList.length, onTotalItemsChange]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAnime = animeList.slice(startIndex, startIndex + itemsPerPage);

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] text-center">
        <div className="text-red-400 text-lg mb-2">Unable to load content</div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-gray-400 hover:text-white underline"
        >
          Try refreshing
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.03,
            },
          },
        }}
      >
        {loading ? (
          Array.from({ length: itemsPerPage }).map((_, i) => (
            <AnimeSkeleton key={`skeleton-${i}`} />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {paginatedAnime.map((show) => (
              <AnimeCard
                key={show.id}
                anime={show}
                onClick={() => {
                  // Determine route based on media type logic
                  const path = show.media_type === "movie" ? "movie" : "tvshow";
                  router.push(`/details/${path}/${show.id}`);
                }}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {!loading && paginatedAnime.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500 gap-2">
          <p className="text-lg">No anime found</p>
        </div>
      )}
    </div>
  );
}
