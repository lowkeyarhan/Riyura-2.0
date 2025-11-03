"use client";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

interface Movie {
  id: number;
  title?: string;
  name?: string;
  original_name?: string;
  overview: string;
  backdrop_path: string;
  genre_ids?: number[];
}

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const BACKDROP_SIZE = "/original";

// Auto-slide timing (in milliseconds)
const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

// Map genre IDs to genre names
const GENRE_MAP: { [key: number]: string } = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export default function Banner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch movies when component first loads
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/trending", { cache: "no-store" });

        // Check if request was successful
        if (!response.ok) {
          throw new Error(`Failed to load movies (${response.status})`);
        }

        // Parse the JSON data
        const data = await response.json();

        setMovies(Array.isArray(data?.results) ? data.results : []);
      } catch (error: any) {
        setError(error?.message || "Something went wrong fetching movies");
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  // Get the currently displayed movie
  const currentMovie = movies[currentSlide];

  // Get genre names for the current movie (limit to 3)
  const movieGenres =
    currentMovie?.genre_ids
      ?.map((id) => GENRE_MAP[id]) // Convert IDs to names
      .filter(Boolean) // Remove undefined values
      .slice(0, 3) || [];

  // Build full image URL from TMDB path
  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder-image.jpg";
    return `${IMAGE_BASE_URL}${BACKDROP_SIZE}${path}`;
  };

  // Shorten long text and add "..." at the end
  const truncate = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Move to next or previous slide
  const changeSlide = (direction: number) => {
    if (movies.length === 0) return;

    setCurrentSlide((prev) => {
      const newSlide = prev + direction;

      // Loop back to last slide if going before first
      if (newSlide < 0) {
        return movies.length - 1;
      }

      // Loop back to first slide if going past last
      if (newSlide >= movies.length) {
        return 0;
      }

      return newSlide;
    });
  };

  // Jump directly to a specific slide (used by dots)
  const goToSlide = (index: number) => {
    // Check if index is valid
    if (index < 0 || index >= movies.length) return;
    setCurrentSlide(index);
  };

  // Compute up to 5 visible dot indices centered around current slide
  const getVisibleDotIndices = (): number[] => {
    const total = movies.length;
    const maxDots = 5;
    if (total <= maxDots) {
      return Array.from({ length: total }, (_, i) => i);
    }
    // If near the start, show first 5
    if (currentSlide <= 2) {
      return [0, 1, 2, 3, 4];
    }
    // If near the end, show last 5
    if (currentSlide >= total - 3) {
      return [total - 5, total - 4, total - 3, total - 2, total - 1];
    }
    // Otherwise, center around current slide
    return [
      currentSlide - 2,
      currentSlide - 1,
      currentSlide,
      currentSlide + 1,
      currentSlide + 2,
    ];
  };

  // When user clicks the Play button
  const handlePlayClick = () => {
    console.log("Play movie:", currentMovie.title);
    // TODO: Add your play/watch functionality here
  };

  // Automatically move to next slide every 5 seconds
  useEffect(() => {
    // Don't auto-slide if no movies
    if (movies.length === 0) return;

    // Set up the timer
    const timer = setInterval(() => {
      changeSlide(1);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [currentSlide, movies.length]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* ===== LOADING STATE ===== */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Loading…
        </div>
      )}

      {/* ===== ERROR STATE ===== */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400">
          {error}
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {!loading && !error && !currentMovie && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          No movies to display
        </div>
      )}

      {/* ===== BACKGROUND IMAGE ===== */}
      {currentMovie && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${getImageUrl(currentMovie.backdrop_path)})`,
          }}
        />
      )}

      {/* ===== GRADIENT OVERLAYS ===== */}
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-black/40" />
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />

      {/* ===== MOVIE INFORMATION ===== */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-32 px-8 md:px-16 lg:px-20">
        {/* Genre Tags*/}
        {currentMovie && movieGenres.length > 0 && (
          <div className="flex items-center gap-3 mb-8">
            {movieGenres.map((genre, index) => (
              <React.Fragment key={index}>
                <span className="text-lg md:text-base text-white/50">
                  {genre}
                </span>
                {index < movieGenres.length - 1 && (
                  <span className="text-white/60 text-xs">●</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Movie Title */}
        {currentMovie && (
          <h1
            className="text-7xl md:text-8xl lg:text-8xl font-black mb-8 text-white drop-shadow-lg"
            style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
          >
            {currentMovie.title ||
              currentMovie.name ||
              currentMovie.original_name}
          </h1>
        )}

        {/* Play Button */}
        {currentMovie && (
          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={handlePlayClick}
              className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full text-lg font-semibold hover:bg-white/90 transition-colors"
            >
              <FontAwesomeIcon icon={faPlay} />
              Play
            </button>
          </div>
        )}

        {/* Movie Description */}
        {currentMovie && (
          <p
            className="text-lg md:text-xl text-white/95 max-w-2xl leading-relaxed drop-shadow-md font-extralight"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {truncate(currentMovie.overview, 170)}
          </p>
        )}
      </div>
    </div>
  );
}
