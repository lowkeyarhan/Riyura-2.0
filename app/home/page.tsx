"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    if (activeSection === section) return; // Prevent animation if clicking same tab
    setActiveSection(section);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-black">
      <Banner />

      {/* Section Selector */}
      <div className="px-8 md:px-16 lg:px-16 pt-12 lg:pb-12">
        {/* Navigation Tabs */}
        <div className="flex justify-center border-b border-white/15 items-center gap-8 pt-8 mb-8">
          {[
            { id: "movies", label: "Movies", icon: Film },
            { id: "tvshows", label: "Series", icon: Tv },
            { id: "anime", label: "Anime", icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSectionChange(tab.id as any)}
              className={`flex items-center gap-2 p-4 transition-colors duration-300 text-2xl relative ${
                activeSection === tab.id
                  ? "text-red-500"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              <tab.icon />
              <span className="font-semibold">{tab.label}</span>

              {/* SLICK SLIDING INDICATOR */}
              {activeSection === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_-2px_10px_rgba(239,68,68,0.5)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Trending now heading */}
        <h2
          className="text-3xl font-semibold mb-8 text-white text-center"
          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
        >
          Trending now
        </h2>

        {/* Content Sections with Smooth Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection} // Key ensures React remounts and animates
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
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
          </motion.div>
        </AnimatePresence>

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
