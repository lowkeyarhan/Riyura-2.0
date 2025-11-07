"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Navbar from "@/src/components/navbar";
import Footer from "@/src/components/footer";

type WatchItemType = "movie" | "tv" | "anime";

interface WatchItem {
  id: number;
  type: WatchItemType;
  title: string;
  poster: string; // full image url or local placeholder
  year?: number;
  rating?: number; // 0-10 scale originally; we'll show /5
  seasons?: number; // tv/anime only
}

// Mock data — mixture of movies, tv shows and anime with real TMDB poster paths
const MOCK_WATCHLIST: WatchItem[] = [
  {
    id: 101,
    type: "movie",
    title: "Inception",
    poster: "https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg",
    year: 2010,
    rating: 8.4,
  },
  {
    id: 102,
    type: "tv",
    title: "Breaking Bad",
    poster: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    year: 2008,
    rating: 9.5,
    seasons: 5,
  },
  {
    id: 103,
    type: "anime",
    title: "Attack on Titan",
    poster: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
    year: 2013,
    rating: 8.8,
    seasons: 4,
  },
  {
    id: 104,
    type: "movie",
    title: "Interstellar",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    year: 2014,
    rating: 8.6,
  },
  {
    id: 105,
    type: "tv",
    title: "Stranger Things",
    poster: "https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
    year: 2016,
    rating: 8.7,
    seasons: 4,
  },
  {
    id: 106,
    type: "anime",
    title: "Demon Slayer",
    poster: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
    year: 2019,
    rating: 8.6,
    seasons: 3,
  },
  {
    id: 107,
    type: "movie",
    title: "The Dark Knight",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    year: 2008,
    rating: 9.0,
  },
  {
    id: 108,
    type: "tv",
    title: "The Mandalorian",
    poster: "https://image.tmdb.org/t/p/w500/eU1i6eHXlzMOlEq0ku1Rzq7Y4wA.jpg",
    year: 2019,
    rating: 8.5,
    seasons: 3,
  },
  {
    id: 109,
    type: "anime",
    title: "One Punch Man",
    poster: "https://image.tmdb.org/t/p/w500/iE3s0lG5QVdEHOEZnoAxjmMtvne.jpg",
    year: 2015,
    rating: 8.7,
    seasons: 2,
  },
  {
    id: 110,
    type: "movie",
    title: "Dune",
    poster: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    year: 2021,
    rating: 8.0,
  },
];

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>(MOCK_WATCHLIST);
  const [filter, setFilter] = useState<"all" | WatchItemType>("all");

  // Filtered items based on selected tab
  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

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
            Keep track of movies, series, and anime you want to watch
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center border-b border-white/15 items-center gap-8 mb-12">
          {[
            { key: "all", label: "All", icon: null },
            { key: "movie", label: "Movies", icon: null },
            { key: "tv", label: "Series", icon: null },
            { key: "anime", label: "Anime", icon: null },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
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
                className="group bg-white/[0.1] rounded-xl flex flex-col"
              >
                {/* Poster */}
                <div className="relative aspect-2/3 rounded-t-xl overflow-hidden cursor-pointer">
                  <Image
                    src={item.poster || "/placeholder.jpg"}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-102"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                </div>

                {/* Info Section */}
                <div className="flex p-3 flex-col gap-2">
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

                  {/* Rating and Seasons */}
                  <div className="flex items-center gap-3">
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
                    {item.seasons && (
                      <span
                        className="text-gray-400 text-sm"
                        style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                      >
                        {item.seasons} Season{item.seasons > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Watched Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    className="mt-2 w-full py-2.5 rounded-lg bg-gray-800/50 hover:bg-red-600 text-white font-medium text-sm transition-all duration-300 border border-gray-700/50 hover:border-red-600"
                    style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                    aria-label={`Mark ${item.title} as watched`}
                  >
                    Watched
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
