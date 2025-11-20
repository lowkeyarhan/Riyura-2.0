"use client";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

interface Movie {
  id: number;
  title?: string;
  name?: string;
  original_name?: string;
  overview: string;
  backdrop_path: string;
  genre_ids?: number[];
}

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
const AUTO_SLIDE_INTERVAL = 5000;

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

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const cacheKey = "banner:trending-movies";
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            setMovies(data.results);
            setLoading(false);
            return;
          }
        }

        const response = await fetch("/api/trending", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load movies");

        const data = await response.json();
        setMovies(data.results || []);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const currentMovie = movies[currentSlide];

  const movieGenres =
    currentMovie?.genre_ids
      ?.map((id) => GENRE_MAP[id])
      .filter(Boolean)
      .slice(0, 3) || [];

  const getImageUrl = (path: string) =>
    path ? `${IMAGE_BASE_URL}${path}` : "/placeholder-image.jpg";

  const truncate = (text: string, maxLength: number) =>
    text?.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text || "";

  const nextSlide = () => {
    if (movies.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % movies.length);
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < movies.length) setCurrentSlide(index);
  };

  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(nextSlide, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [movies.length]);
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
          Loading…
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xl">
          {error}
        </div>
      )}

      {!loading && !error && movies.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
          No movies available
        </div>
      )}

      {currentMovie && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${getImageUrl(
                currentMovie.backdrop_path
              )})`,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          <div className="relative z-10 h-full flex flex-col justify-between p-8 md:p-16">
            <div className="flex-1 flex flex-col justify-end">
              {movieGenres.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  {movieGenres.map((genre, i) => (
                    <React.Fragment key={i}>
                      <span className="text-sm md:text-base text-white/70">
                        {genre}
                      </span>
                      {i < movieGenres.length - 1 && (
                        <span className="text-white/50">●</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 text-white drop-shadow-lg leading-none">
                {currentMovie.title ||
                  currentMovie.name ||
                  currentMovie.original_name}
              </h1>

              <button className="w-fit flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition mb-6">
                <FontAwesomeIcon icon={faPlay} />
                Play
              </button>

              <p className="text-base md:text-lg text-white/90 max-w-2xl leading-relaxed drop-shadow-md">
                {truncate(currentMovie.overview, 170)}
              </p>
            </div>

            {movies.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {movies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? "bg-white w-8"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
