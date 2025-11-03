"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/src/components/navbar";
import Image from "next/image";
import { Search, X } from "lucide-react";

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

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, movies, tv
  const [lastQuery, setLastQuery] = useState("");

  const handleSearch = async (q?: string) => {
    const query = (q ?? searchQuery).trim();
    if (!query) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${
          process.env.NEXT_PUBLIC_TMDB_API_KEY
        }&query=${encodeURIComponent(query)}&page=1`
      );
      const data = await response.json();
      // Filter to only include movies and TV shows
      const filteredResults = data.results.filter(
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(7, 9, 16)" }}>
      <Navbar />

      {/* Main Content */}
      <div className="px-8 md:px-16 lg:px-20 pt-24 pb-12">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for movies and TV shows..."
              className="w-full px-6 py-4 pr-14 bg-white/5 rounded-full text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-all text-lg"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            />
            <button
              onClick={() => handleSearch()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
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

        {/* Filter Tabs */}
        {results.length > 0 && (
          <div className="flex justify-center gap-2 mb-12">
            {[
              { key: "all", label: "A L L" },
              { key: "movies", label: "M O V I E" },
              { key: "tv", label: "T V" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2 rounded-full transition-all ${
                  activeTab === tab.key
                    ? "bg-red-600 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
                style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p
              className="text-gray-400 text-lg"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Searching...
            </p>
          </div>
        )}

        {/* Empty State - Initial */}
        {!isLoading && results.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Search className="w-16 h-16 text-gray-600" />
            </div>
            <h2
              className="text-3xl font-semibold mb-3 text-white"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Search for content
            </h2>
            <p
              className="text-gray-400 text-lg max-w-md"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Discover millions of movies and TV shows. Search by title, genre,
              or keyword.
            </p>
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
          <div>
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
                    <span className="text-white">
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
              {filteredResults.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col bg-[#1a1625] rounded-2xl overflow-hidden transition-transform duration-300 hover:shadow-2xl"
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
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
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
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
