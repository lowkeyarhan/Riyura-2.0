"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/src/components/navbar";
import Image from "next/image";
import { Search, X, TrendingUp, Star, Film, Tv } from "lucide-react";
import { motion } from "framer-motion";

// Interface for search results from TMDB API
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

// Interface for trending content
interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, movies, tv
  const [lastQuery, setLastQuery] = useState("");
  
  // State for trending content
  const [trendingMovies, setTrendingMovies] = useState<TrendingItem[]>([]);
  const [trendingTV, setTrendingTV] = useState<TrendingItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Fetch trending content on component mount
  useEffect(() => {
    const fetchTrending = async () => {
      setTrendingLoading(true);
      try {
        // Fetch trending movies and TV shows in parallel
        const [moviesRes, tvRes] = await Promise.all([
          fetch("/api/trending"),
          fetch("/api/trending-tv"),
        ]);
        
        const moviesData = await moviesRes.json();
        const tvData = await tvRes.json();
        
        // Get first 10 items from each
        const movies = Array.isArray(moviesData?.results) 
          ? moviesData.results.slice(0, 10) 
          : [];
        const tv = Array.isArray(tvData?.results) 
          ? tvData.results.slice(0, 10) 
          : [];
        
        setTrendingMovies(movies);
        setTrendingTV(tv);
      } catch (error) {
        console.error("Error fetching trending content:", error);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const handleSearch = async (q?: string) => {
    const query = (q ?? searchQuery).trim();
    if (!query) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=multi`
      );
      const data = await response.json();
      // Ensure we always have an array
      const list: SearchResult[] = Array.isArray(data?.results)
        ? data.results
        : [];
      // Filter to only include movies and TV shows
      const filteredResults = list.filter(
        (item: SearchResult) =>
          item.media_type === "movie" || item.media_type === "tv"
      );
      setResults(filteredResults);
      setLastQuery(query);
    } catch (error) {
      console.error("Error searching:", error);
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleItemClick = (item: SearchResult) => {
    if (item.media_type === "movie") {
      router.push(`/details/movie/${item.id}`);
    } else if (item.media_type === "tv") {
      router.push(`/details/tvshow/${item.id}`);
    }
  };

  const filteredResults = results.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "movies") return item.media_type === "movie";
    if (activeTab === "tv") return item.media_type === "tv";
    return true;
  });

  // Handler to navigate to trending item
  const handleTrendingClick = (item: TrendingItem, type: "movie" | "tv") => {
    if (type === "movie") {
      router.push(`/details/movie/${item.id}`);
    } else {
      router.push(`/details/tvshow/${item.id}`);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(7, 9, 16)" }}>
      <Navbar />

      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        />
        <div className="relative px-8 md:px-16 lg:px-20 pt-24 pb-12">
          {/* Hero Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 
              className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Discover Your Next Favorite
            </h1>
            <p 
              className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Search millions of movies and TV shows. Find what you love.
            </p>
          </motion.div>

          {/* Enhanced Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto mb-8"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-0 group-hover:opacity-30 blur transition duration-300"></div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search for movies and TV shows..."
                  className="w-full px-6 py-4 pr-14 bg-white/5 backdrop-blur-sm rounded-full text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-purple-500/50 transition-all text-lg border border-white/10"
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                />
                <button
                  onClick={() => handleSearch()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-full transition-all transform hover:scale-105"
                  disabled={!searchQuery.trim() || isLoading}
                >
                  <Search className="w-5 h-5 text-white" />
                </button>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setResults([]);
                    }}
                    className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Filter Tabs with Icons */}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-3 mb-12"
            >
              {[
                { key: "all", label: "All", icon: Star },
                { key: "movies", label: "Movies", icon: Film },
                { key: "tv", label: "TV Shows", icon: Tv },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all transform hover:scale-105 ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                      : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                  }`}
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              ))}
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p
                className="text-gray-400 text-lg"
                style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
              >
                Searching...
              </p>
            </div>
          )}

          {/* Trending Section - Shows when no search is active */}
          {!isLoading && results.length === 0 && !searchQuery && (
            <div className="space-y-12 pb-12">
              {/* Trending Movies */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-8 h-8 text-pink-500" />
                  <h2
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                  >
                    Trending Movies
                  </h2>
                </div>
                
                {trendingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
                      {trendingMovies.map((movie, index) => (
                        <motion.div
                          key={movie.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          onClick={() => handleTrendingClick(movie, "movie")}
                          className="flex-shrink-0 w-48 cursor-pointer group snap-start"
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-purple-500/50">
                            {movie.poster_path ? (
                              <Image
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title || movie.name || ""}
                                fill
                                className="object-cover"
                                sizes="192px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <Film className="w-12 h-12 text-gray-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {movie.vote_average > 0 && (
                              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-white text-sm font-semibold">
                                  {movie.vote_average.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          <h3
                            className="text-white font-semibold line-clamp-2 text-sm group-hover:text-purple-400 transition-colors"
                            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                          >
                            {movie.title || movie.name}
                          </h3>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Trending TV Shows */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <h2
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                  >
                    Trending TV Shows
                  </h2>
                </div>
                
                {trendingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
                      {trendingTV.map((show, index) => (
                        <motion.div
                          key={show.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          onClick={() => handleTrendingClick(show, "tv")}
                          className="flex-shrink-0 w-48 cursor-pointer group snap-start"
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-pink-500/50">
                            {show.poster_path ? (
                              <Image
                                src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                                alt={show.name || show.title || ""}
                                fill
                                className="object-cover"
                                sizes="192px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <Tv className="w-12 h-12 text-gray-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {show.vote_average > 0 && (
                              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-white text-sm font-semibold">
                                  {show.vote_average.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          <h3
                            className="text-white font-semibold line-clamp-2 text-sm group-hover:text-pink-400 transition-colors"
                            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                          >
                            {show.name || show.title}
                          </h3>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Popular Searches Suggestion */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center py-8"
              >
                <h3
                  className="text-2xl font-semibold mb-4 text-white"
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                >
                  Popular Searches
                </h3>
                <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                  {["Marvel", "Star Wars", "Action", "Comedy", "Thriller", "Anime", "Documentary", "Romance"].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchQuery(term);
                        handleSearch(term);
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-600 text-gray-300 hover:text-white rounded-full transition-all transform hover:scale-105 border border-white/10"
                      style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Empty State - No Results */}
          {!isLoading && results.length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <X className="w-16 h-16 text-gray-600" />
              </div>
              <h2
                className="text-3xl font-semibold mb-3 text-white"
                style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
              >
                No results found
              </h2>
              <p
                className="text-gray-400 text-lg max-w-md"
                style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
              >
                Try adjusting your search or browse our collection.
              </p>
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && filteredResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <h2
                  className="text-3xl font-semibold text-white"
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                >
                  Search Results
                  {(lastQuery || searchQuery) && (
                    <>
                      {" "}
                      for{" "}
                      <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        {lastQuery || searchQuery}
                      </span>
                    </>
                  )}
                  <span className="text-gray-400 text-xl ml-3">
                    ({filteredResults.length}{" "}
                    {filteredResults.length === 1 ? "result" : "results"})
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredResults.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="flex flex-col bg-[#1a1625] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105 border border-white/5"
                  >
                  {/* Poster Image */}
                  <div className="relative aspect-[2/3]">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title || item.name || ""}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        onClick={() => handleItemClick(item)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                        No Poster
                      </div>
                    )}
                    {/* Media Type Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-black/70 backdrop-blur-sm rounded p-1.5">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {item.media_type === "movie" ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          )}
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-4 flex flex-col gap-3">
                    {/* Title */}
                    <h3
                      className="text-white text-lg font-semibold line-clamp-1 transition-colors"
                      style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                    >
                      {item.title || item.name}
                    </h3>

                    {/* Date and Rating */}
                    <div className="flex items-center justify-between text-sm">
                      <div
                        className="flex items-center gap-1.5 text-gray-400"
                        style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                      >
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
                        <span>
                          {formatDate(item.release_date || item.first_air_date)}
                        </span>
                      </div>
                      {item.vote_average > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <svg
                            className="w-4 h-4 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          <span
                            className="font-semibold"
                            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                          >
                            {item.vote_average.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Overview */}
                    {item.overview && (
                      <p
                        className="text-gray-400 text-sm line-clamp-2 leading-relaxed"
                        style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                      >
                        {item.overview}
                      </p>
                    )}

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-4 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
                          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                        >
                          <svg
                            className="w-4 h-4 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                          </svg>
                          Watch Now
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to watchlist functionality
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold transition-all border border-white/10 hover:border-purple-500/50"
                          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                        >
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
                              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                          Add to Watchlist
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
