"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Search, Bell, Play, Plus, Star, ArrowUp } from "lucide-react";
import Navbar from "@/src/components/navbar";

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

const genres = [
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

export default function ExplorePage() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Action"]);
  const [mediaType, setMediaType] = useState<string>("all");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchMedia = useCallback(
    async (page: number, genres: string[], media: string) => {
      setLoading(true);
      try {
        const genreParams = genres.join(",");
        const response = await fetch(
          `/api/explore?page=${page}&genres=${genreParams}&mediaType=${media}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();

        setItems((prev) =>
          page === 1 ? data.results : [...prev, ...data.results]
        );
        setHasMore(
          data.results &&
            data.results.length > 0 &&
            data.page < data.total_pages
        );
      } catch (error) {
        console.error(error);
        // Handle error state in UI
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setPage(1);
    fetchMedia(1, selectedGenres, mediaType);
  }, [selectedGenres, mediaType, fetchMedia]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchMedia(newPage, selectedGenres, mediaType);
  }, [loading, hasMore, page, selectedGenres, mediaType, fetchMedia]);

  const handleGenreClick = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const resetGenres = () => {
    setSelectedGenres([]);
  };

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore]);

  // Scroll to top button visibility logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const threshold = clientHeight * 1.5;

      setShowScrollToTop(scrollHeight > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    // Check on mount
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(7, 9, 16)" }}>
      <Navbar />

      {/* Main Content */}
      <main className="pt-35 px-8 md:px-16 lg:px-20">
        {/* Genre Pills */}
        <div className="mb-8 flex flex-col items-center justify-center gap-4">
          <div className="flex flex-wrap justify-center gap-3">
            {genres.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => handleGenreClick(genre)}
                  className={`px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                    isSelected
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20 scale-105"
                      : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                  }`}
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Type Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setMediaType("all")}
              className={`px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                mediaType === "all"
                  ? "bg-red-500 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              All
            </button>
            <button
              onClick={() => setMediaType("movie")}
              className={`px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                mediaType === "movie"
                  ? "bg-red-500 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Movies
            </button>
            <button
              onClick={() => setMediaType("tv")}
              className={`px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                mediaType === "tv"
                  ? "bg-red-500 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              TV
            </button>
          </div>
          {selectedGenres.length > 0 && (
            <button
              onClick={resetGenres}
              className="flex h-full items-center justify-center gap-2 px-5 py-3 rounded-full text-sm text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-shrink-0"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              <span className="w-4 h-4 flex items-center justify-center">
                ✕
              </span>
              Clear All
            </button>
          )}
        </div>

        {/* Content Grid */}
        <div className="pb-12">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 md:gap-6">
            {items.map((item, index) => (
              <div
                key={`${item.media_type || (item.title ? "movie" : "tv")}-${
                  item.id
                }-${index}`}
                className="group relative rounded-2xl bg-white/[0.1]  hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-t-xl overflow-hidden">
                  <img
                    src={
                      item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : "/placeholder.jpg"
                    }
                    alt={item.title || item.name || "Media poster"}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-102 group-hover:brightness-75"
                  />
                  {/* Bottom gradient for readability */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                  {/* Rating badge */}
                  <div className="absolute left-3 bottom-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-white font-semibold">
                      {item.vote_average.toFixed(1)}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 p-4">
                    <button className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105">
                      <Play className="w-5 h-5 text-white fill-white ml-1" />
                    </button>
                    <button className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200">
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Movie Info */}
                <div className="mt-2 p-3 space-y-1">
                  <h3
                    className="text-white text-base font-semibold truncate group-hover:text-red-500 transition-colors duration-200"
                    style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                  >
                    {item.title || item.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {(item.release_date || item.first_air_date)?.substring(
                      0,
                      4
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 md:gap-6 mt-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[2/3] rounded-xl bg-gray-800/50 animate-pulse" />
                  <div className="h-4 bg-gray-800/50 rounded animate-pulse" />
                  <div className="h-3 bg-gray-800/50 rounded w-2/3 animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Load More Trigger */}
          <div
            ref={loadMoreRef}
            className="h-20 flex items-center justify-center mt-12"
          >
            {!hasMore && (
              <p className="text-gray-500 text-sm">No more content to load</p>
            )}
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 backdrop-blur-2xl  text-white rounded-full px-6 py-4 shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-110 hover:shadow-red-500/50"
            aria-label="Scroll to top"
          >
            <ArrowUp size={24} />
            <span className="font-semibold">Back to Top</span>
          </button>
        )}
      </main>
    </div>
  );
}
