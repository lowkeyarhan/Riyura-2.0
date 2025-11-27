"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Movies from "@/src/components/movies";
import TVShows from "@/src/components/tvshows";
import Anime from "@/src/components/anime";
import Pagination from "@/src/components/pagination";
import { Film, Tv, Sparkles } from "lucide-react";

interface HomeClientProps {
  initialData: {
    movies: { results: any[] };
    tvShows: { results: any[] };
    anime: { results: any[] };
    bannerData: { results: any[] };
  };
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const [activeSection, setActiveSection] = useState<
    "movies" | "tvshows" | "anime"
  >("movies");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const handleSectionChange = (section: "movies" | "tvshows" | "anime") => {
    if (activeSection === section) return;
    setActiveSection(section);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const TABS = [
    { id: "movies", label: "Movies", icon: Film },
    { id: "tvshows", label: "Series", icon: Tv },
    { id: "anime", label: "Anime", icon: Sparkles },
  ];

  return (
    <div className="px-4 md:px-16 lg:px-16 pt-8 lg:pb-12">
      {/* --- NAVIGATION TABS (Redesigned) --- */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center p-1.5 bg-[#151821] border border-white/10 rounded-full shadow-2xl relative z-10">
          {TABS.map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSectionChange(tab.id as any)}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all duration-300 z-10
                  ${
                    isActive
                      ? "text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }
                `}
                style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
              >
                {/* Icon */}
                <tab.icon
                  size={16}
                  className={`transition-colors duration-300 ${
                    isActive
                      ? "text-white"
                      : "text-gray-500 group-hover:text-gray-300"
                  }`}
                />

                {/* Icon (Hidden on very small screens if needed, currently visible) */}
                <span className="hidden sm:block">{tab.label}</span>

                {/* Sliding Background Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Heading */}
      <h2
        className="text-2xl md:text-3xl font-bold mb-8 text-white text-center tracking-tight"
        style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
      >
        Trending Now
      </h2>

      {/* Content Sections with Smooth Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 15, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -15, filter: "blur(5px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {activeSection === "movies" && (
            <Movies
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onTotalItemsChange={setTotalItems}
              initialMovies={initialData.movies.results}
            />
          )}
          {activeSection === "tvshows" && (
            <TVShows
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onTotalItemsChange={setTotalItems}
              initialTVShows={initialData.tvShows.results}
            />
          )}
          {activeSection === "anime" && (
            <Anime
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onTotalItemsChange={setTotalItems}
              initialAnime={initialData.anime.results}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      <div className="mt-12">
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
