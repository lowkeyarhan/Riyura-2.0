"use client";

import React, { useState } from "react";
import Banner from "@/src/components/banner";
import Navbar from "@/src/components/navbar";
import Movies from "@/src/components/movies";
import TVShows from "@/src/components/tvshows";
import Anime from "@/src/components/anime";
import { Film, Tv, Sparkles } from "lucide-react";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<
    "movies" | "tvshows" | "anime"
  >("movies");

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Banner />

      {/* Section Selector */}
      <div className="px-8 md:px-16 lg:px-20 py-12">
        {/* Navigation Tabs */}
        <div className="flex justify-center border-b border-white/15 items-center gap-8 pt-8 mb-8">
          <button
            onClick={() => setActiveSection("movies")}
            className={`flex items-center gap-2 p-4 transition-all duration-300 text-2xl relative ${
              activeSection === "movies"
                ? "text-red-500"
                : "text-gray-400 hover:text-white"
            }`}
            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
          >
            <Film />
            <span className="font-semibold">Movies</span>
            {activeSection === "movies" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setActiveSection("tvshows")}
            className={`flex items-center gap-2 p-4 text-2xl transition-all duration-300 relative ${
              activeSection === "tvshows"
                ? "text-red-500"
                : "text-gray-400 hover:text-white"
            }`}
            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
          >
            <Tv />
            <span className="font-semibold">Series</span>
            {activeSection === "tvshows" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setActiveSection("anime")}
            className={`flex items-center gap-2 p-4 text-2xl transition-all duration-300 relative ${
              activeSection === "anime"
                ? "text-red-500"
                : "text-gray-400 hover:text-white"
            }`}
            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
          >
            <Sparkles />
            <span className="font-semibold">Anime</span>
            {activeSection === "anime" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>
        </div>

        {/* Trending now heading */}
        <h2
          className="text-3xl font-semibold mb-8 text-white text-center"
          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
        >
          Trending now
        </h2>

        {/* Content Sections */}
        {activeSection === "movies" && <Movies />}
        {activeSection === "tvshows" && <TVShows />}
        {activeSection === "anime" && <Anime />}
      </div>
    </div>
  );
}
