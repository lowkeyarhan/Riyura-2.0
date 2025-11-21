"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Film, Tv } from "lucide-react";

// Types
interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: string;
  poster_path: string;
  first_air_date?: string;
  release_date?: string | null;
  vote_average: number;
  overview?: string;
}

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  media_type?: string;
  overview?: string;
  release_date?: string | null;
  first_air_date?: string | null;
}

// Constants
const TABS = [
  { key: "all", label: "A L L" },
  { key: "movies", label: "M O V I E" },
  { key: "tv", label: "T V" },
];

const QUICK_SEARCHES = [
  "Action",
  "Comedy",
  "Thriller",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Drama",
  "Adventure",
  "Animation",
  "Mystery",
];

const PLACEHOLDER_TEXTS = [
  'Search "Interstellar"',
  'Try "Top trending anime"',
  'Find "Christopher Nolan"',
  'Search by genre "Cyberpunk"',
];

const FONT_STYLE = { fontFamily: "Be Vietnam Pro, sans-serif" };
const TRENDING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Use sessionStorage for trending cache
const TRENDING_CACHE_KEY = "trendingCache";
let trendingCache: null = null;

// Icon Components
const MovieIcon = () => (
  <svg
    className="w-5 h-5 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
    />
  </svg>
);

const TVIcon = () => (
  <svg
    className="w-5 h-5 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
  </svg>
);

// Skeleton Components
const TrendingSkeleton = () => (
  <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 h-[320px] animate-pulse">
    <div className="flex flex-col justify-between h-full gap-6">
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <div className="w-20 h-6 bg-white/10 rounded-full" />
        <div className="w-12 h-6 bg-white/10 rounded-full" />
      </div>

      {/* Middle Content */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="w-3/4 h-8 bg-white/10 rounded" />
        <div className="space-y-2">
          <div className="w-full h-4 bg-white/10 rounded" />
          <div className="w-full h-4 bg-white/10 rounded" />
          <div className="w-2/3 h-4 bg-white/10 rounded" />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between mt-auto">
        <div className="w-24 h-4 bg-white/10 rounded" />
        <div className="w-20 h-4 bg-white/10 rounded" />
      </div>
    </div>
  </div>
);

export default function SearchPage() {
  const router = useRouter();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [lastQuery, setLastQuery] = useState("");
  const [trendingMovies, setTrendingMovies] = useState<TrendingItem[]>([]);
  const [trendingTV, setTrendingTV] = useState<TrendingItem[]>([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);

  const placeholderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    if (PLACEHOLDER_TEXTS.length <= 1) return;

    const interval = setInterval(() => {
      setPlaceholderOpacity(0);
      placeholderTimeoutRef.current = setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
        setPlaceholderOpacity(1);
      }, 200);
    }, 4000);

    return () => {
      clearInterval(interval);
      if (placeholderTimeoutRef.current)
        clearTimeout(placeholderTimeoutRef.current);
    };
  }, []);

  const fetchTrending = async () => {
    setIsTrendingLoading(true);
    try {
      const now = Date.now();

      const cached = sessionStorage.getItem(TRENDING_CACHE_KEY);
      if (cached) {
        try {
          const { movies, tv, fetchedAt } = JSON.parse(cached);
          if (now - fetchedAt < TRENDING_CACHE_TTL) {
            setTrendingMovies(movies);
            setTrendingTV(tv);
            setIsTrendingLoading(false);
            return;
          }
        } catch {
          sessionStorage.removeItem(TRENDING_CACHE_KEY);
        }
      }

      const [moviesRes, tvRes] = await Promise.all([
        fetch("/api/trending"),
        fetch("/api/trending-tv"),
      ]);
      const moviesData = await moviesRes.json();
      const tvData = await tvRes.json();

      const movies = moviesData.results?.slice(0, 6) || [];
      const tv = tvData.results?.slice(0, 6) || [];

      sessionStorage.setItem(
        TRENDING_CACHE_KEY,
        JSON.stringify({ movies, tv, fetchedAt: now })
      );
      setTrendingMovies(movies);
      setTrendingTV(tv);
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setIsTrendingLoading(false);
    }
  };

  const handleSearch = async (q?: string) => {
    const query = (q ?? searchQuery).trim();
    if (!query) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=multi`
      );
      const data = await response.json();

      const filtered = (data?.results || []).filter(
        (item: SearchResult) =>
          item.media_type === "movie" || item.media_type === "tv"
      );
      setResults(filtered);
      setLastQuery(query);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
      setSearchQuery("");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
    setLastQuery("");
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const navigateToDetails = (item: SearchResult) => {
    const path =
      item.media_type === "movie"
        ? `/details/movie/${item.id}`
        : `/details/tvshow/${item.id}`;
    router.push(path);
  };

  const filteredResults = results.filter(
    (item) =>
      activeTab === "all" ||
      item.media_type === (activeTab === "movies" ? "movie" : "tv")
  );

  const trendingHighlights = [
    ...trendingMovies.map((item) => ({
      ...item,
      mediaCategory: "movie" as const,
    })),
    ...trendingTV.map((item) => ({ ...item, mediaCategory: "tv" as const })),
  ].slice(0, 6);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* 1. Base Black */}
        <div className="absolute inset-0 bg-black" />
        {/* 2. Deep Cyan Blob (Top Left) */}
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#155f75b5] blur-[130px] opacity-40" />
        {/* 3. Deep Orange Blob (Bottom Right) */}
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#9a341299] blur-[130px] opacity-30 mix-blend-screen" />
        {/* 4. Vignette (Keeps edges dark) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)]" />
      </div>

      <div className="relative z-10 px-8 md:px-16 lg:px-16 pt-32 pb-12">
        {/* Hero Section */}
        {!lastQuery && (
          <div className="text-center mb-16 max-w-5xl mx-auto">
            <h1
              className="text-3xl md:text-4xl lg:text-6xl font-bold mb-6 text-white tracking-wide"
              style={{
                fontFamily: "MMontserrat, sans-serif",
                letterSpacing: "0.02em",
              }}
            >
              To find it later, just search for it.
            </h1>
            <p
              className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400 }}
            >
              Search by keyword, brand, type, date, color – whatever you think
              of first. Discover millions of movies and shows instantly.
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="flex items-center gap-4 rounded-full bg-[#1a2332]/80 border border-white/10 px-6 py-4 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_25px_60px_rgba(0,255,255,0.15)]">
            <Search className="w-5 h-5 text-cyan-400" />
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder=""
                className="w-full bg-transparent text-base md:text-lg text-white placeholder-transparent focus:outline-none"
                style={FONT_STYLE}
              />
              {!searchQuery && (
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none transition-opacity duration-500 ${
                    placeholderOpacity === 1 ? "opacity-100" : "opacity-0"
                  }`}
                  style={FONT_STYLE}
                >
                  {PLACEHOLDER_TEXTS[placeholderIndex]}
                </span>
              )}
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSearch()}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-sm md:text-base font-bold text-white shadow-[0_0_24px_rgba(255,80,0,0.35)] transition-all duration-300 hover:shadow-[0_0_32px_rgba(255,80,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              disabled={!searchQuery.trim() || isLoading}
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Trending Highlights & Skeletons */}
        {!lastQuery &&
          !isLoading &&
          (isTrendingLoading || trendingHighlights.length > 0) && (
            <section className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
                <div className="text-left">
                  <p className="flex items-center gap-2 text-xs tracking-[0.35em] uppercase text-slate-400">
                    Trending Now
                  </p>
                  <h2 className="text-3xl md:text-4xl font-semibold text-white mt-2">
                    Riyura Spotlight
                  </h2>
                  <p className="text-sm text-slate-400 mt-3 max-w-xl">
                    Your personalized mix of movies and shows lighting up the
                    charts this week.
                  </p>
                </div>
              </div>

              <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
                {isTrendingLoading
                  ? // Render Skeletons
                    Array.from({ length: 6 }).map((_, i) => (
                      <TrendingSkeleton key={`skeleton-${i}`} />
                    ))
                  : // Render Actual Content
                    trendingHighlights.map((item) => {
                      const isMovie = item.mediaCategory === "movie";
                      const href = isMovie
                        ? `/details/movie/${item.id}`
                        : `/details/tvshow/${item.id}`;
                      const Icon = isMovie ? Film : Tv;
                      const releaseDate =
                        item.release_date || item.first_air_date;
                      const cardOverview =
                        item.overview ||
                        (isMovie
                          ? "Experience the cinematic moment everyone is talking about."
                          : "Binge the series that is dominating conversations right now.");

                      return (
                        <div
                          key={`${item.id}-${item.mediaCategory}`}
                          onClick={() => router.push(href)}
                          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#161a39] via-[#10172c] to-[#070b18] p-6 cursor-pointer transition-all duration-500 hover:shadow-[0_30px_60px_-18px_rgba(7,11,24,0.9)]"
                        >
                          {item.backdrop_path || item.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w780${
                                item.backdrop_path || item.poster_path
                              }`}
                              alt={item.title || item.name || ""}
                              fill
                              className="object-cover opacity-40 group-hover:opacity-55 transition-opacity duration-500"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/20 to-purple-700/10" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-black/70" />

                          <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-slate-200">
                                <Icon className="w-4 h-4" />
                                {isMovie ? "Movie" : "TV"}
                              </span>
                              {item.vote_average > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                                  <StarIcon />
                                  {item.vote_average.toFixed(1)}
                                </span>
                              )}
                            </div>

                            <div>
                              <h3 className="text-2xl font-semibold text-white leading-tight line-clamp-2">
                                {item.title || item.name}
                              </h3>
                              <p className="mt-3 text-sm text-slate-300/80 leading-relaxed line-clamp-3">
                                {cardOverview}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-300">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Premiere</span>
                                <div className="flex items-center gap-1 text-slate-200">
                                  <CalendarIcon />
                                  <span>{formatDate(releaseDate)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 uppercase tracking-[0.3em] text-pink-300">
                                <PlayIcon />
                                Watch
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </section>
          )}

        {/* Filter Tabs */}
        {results.length > 0 && (
          <div className="flex justify-center gap-2 mb-12">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-7 py-2 rounded-full text-sm md:text-base font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-[0_0_24px_rgba(255,80,0,0.35)]"
                    : "bg-[#1a2332]/80 text-gray-400 border border-white/10 hover:border-cyan-500/50 hover:text-white hover:bg-[#1a2332]"
                }`}
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
            </div>
            <p className="text-gray-400 text-lg" style={FONT_STYLE}>
              Searching...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <X className="w-16 h-16 text-gray-600" />
            </div>
            <h2
              className="text-3xl font-semibold mb-3 text-white"
              style={FONT_STYLE}
            >
              No results found
            </h2>
            <p className="text-gray-400 text-lg max-w-md" style={FONT_STYLE}>
              Try adjusting your search or browse our collection.
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && filteredResults.length > 0 && (
          <div>
            <div className="mb-8 text-center">
              <h2
                className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 bg-clip-text text-transparent"
                style={FONT_STYLE}
              >
                Search Results
              </h2>
              {(lastQuery || searchQuery) && (
                <p className="text-gray-300 text-lg" style={FONT_STYLE}>
                  Found{" "}
                  <span className="text-white font-semibold">
                    {filteredResults.length}
                  </span>{" "}
                  {filteredResults.length === 1 ? "result" : "results"} for "
                  {lastQuery || searchQuery}"
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredResults.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col bg-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-102 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer"
                  onClick={() => navigateToDetails(item)}
                >
                  <div className="relative aspect-[2/3]">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title || item.name || ""}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                        No Poster
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 right-3 z-10 bg-black/70 backdrop-blur-sm rounded p-1.5">
                      {item.media_type === "movie" ? <MovieIcon /> : <TVIcon />}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    <h3
                      className="text-white text-lg font-semibold line-clamp-1"
                      style={FONT_STYLE}
                    >
                      {item.title || item.name}
                    </h3>

                    <div className="flex items-center justify-between text-sm">
                      <div
                        className="flex items-center gap-1.5 text-gray-400"
                        style={FONT_STYLE}
                      >
                        <CalendarIcon />
                        <span>
                          {formatDate(item.release_date || item.first_air_date)}
                        </span>
                      </div>
                      {item.vote_average > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <StarIcon />
                          <span className="font-semibold" style={FONT_STYLE}>
                            {item.vote_average.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.overview && (
                      <p
                        className="text-gray-400 text-sm line-clamp-2 leading-relaxed"
                        style={FONT_STYLE}
                      >
                        {item.overview}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
