"use client";

import React, { useState } from "react";
import Banner from "@/src/components/banner";
import Movies from "@/src/components/movies";
import TVShows from "@/src/components/tvshows";
import Anime from "@/src/components/anime";
import Pagination from "@/src/components/pagination";
import { Film, Tv, Sparkles } from "lucide-react";
import Footer from "@/src/components/footer";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<
    "movies" | "tvshows" | "anime"
  >("movies");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const handleSectionChange = (section: "movies" | "tvshows" | "anime") => {
    setActiveSection(section);
    setCurrentPage(1); // Reset to page 1 when switching sections
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-black">
      <Banner />

      {/* Section Selector */}
      <div className="px-8 md:px-16 lg:px-16 pt-12 lg:pb-12">
        {/* Navigation Tabs */}
        <div className="flex justify-center border-b border-white/15 items-center gap-8 pt-8 mb-8">
          <button
            onClick={() => handleSectionChange("movies")}
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
            onClick={() => handleSectionChange("tvshows")}
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
            onClick={() => handleSectionChange("anime")}
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
        {activeSection === "movies" && (
          <Movies
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onTotalItemsChange={setTotalItems}
          />
        )}
        {activeSection === "tvshows" && (
          <TVShows
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onTotalItemsChange={setTotalItems}
          />
        )}
        {activeSection === "anime" && (
          <Anime
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onTotalItemsChange={setTotalItems}
          />
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>
      <Footer />
    </div>
  );
}
