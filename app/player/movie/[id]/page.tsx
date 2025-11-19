"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/src/components/navbar";
import { Calendar, Star, Clock, Wifi } from "lucide-react";

// Generate stream links based on movie ID
const generateStreamLinks = (tmdbId: string) => {
  return [
    {
      server: "Syntherion",
      link: `${process.env.NEXT_PUBLIC_VIDSRC_BASE_URL}/movie/${tmdbId}`,
      quality: "1080p",
    },
    {
      server: "IronLink",
      link: `${process.env.NEXT_PUBLIC_VIDLINK_BASE_URL}/movie/${tmdbId}`,
      quality: "1080p",
    },
    {
      server: "Dormannu (ads)",
      link: `${process.env.NEXT_PUBLIC_VIDEASY_BASE_URL}/movie/${tmdbId}`,
      quality: "4K",
    },
    {
      server: "Nanovue",
      link: `${process.env.NEXT_PUBLIC_YTHD_BASE_URL}/movie/${tmdbId}`,
      quality: "1080p",
    },
  ];
};

// ServerCard Component
interface ServerCardProps {
  name: string;
  quality: string;
  isActive: boolean;
  onClick: () => void;
}

function ServerCard({ name, quality, isActive, onClick }: ServerCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-xl overflow-hidden transition-all cursor-pointer
        ${
          isActive
            ? "bg-red-600/10 border border-red-600/30"
            : "bg-white/[0.03] border border-white/[0.08]"
        }
        hover:bg-white/[0.06] hover:border-white/[0.12]
      `}
      style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
    >
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
            w-10 h-10 rounded-lg flex items-center justify-center transition-colors
            ${isActive ? "bg-red-600/20" : "bg-white/[0.05]"}
          `}
          >
            <Wifi
              className={`w-4 h-4 ${
                isActive ? "text-red-500" : "text-white/50"
              }`}
            />
          </div>
          <div>
            <h4
              className={`text-sm font-semibold ${
                isActive ? "text-white" : "text-white/80"
              }`}
            >
              {name}
            </h4>
            <p className="text-xs text-white/50">{quality}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function Page() {
  const params = useParams();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeServerIndex, setActiveServerIndex] = useState(0);

  const servers = generateStreamLinks(movieId);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        console.log(`🎬 Movie Player: Fetching details for ID ${movieId}...`);
        const startTime = performance.now();
        setLoading(true);
        const response = await fetch(`/api/movie/${movieId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch movie details");
        }
        const data = await response.json();
        const endTime = performance.now();
        const cacheStatus = response.headers.get("X-Cache-Status");
        const loadTime = (endTime - startTime).toFixed(0);
        if (cacheStatus === "HIT") {
          console.log(`✅ Movie Player: Loaded from CACHE in ${loadTime}ms ⚡`);
        } else {
          console.log(
            `✅ Movie Player: Loaded FRESH from API in ${loadTime}ms`
          );
        }
        setMovie(data);
      } catch (err) {
        console.error("Error fetching movie:", err);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "rgb(7, 9, 16)",
          fontFamily: "Be Vietnam Pro, sans-serif",
        }}
      >
        <Navbar />
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="h-screen text-white"
      style={{
        backgroundColor: "rgb(7, 9, 16)",
        fontFamily: "Be Vietnam Pro, sans-serif",
      }}
    >
      <Navbar />

      <div className="relative px-4 sm:px-6 lg:px-16 pt-24 pb-12 space-y-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player - Embed */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl">
              <div className="relative aspect-video">
                <iframe
                  src={servers[activeServerIndex].link}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>

            {/* Servers Section */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                Available Servers
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {servers.map((server, index) => (
                  <ServerCard
                    key={server.server}
                    name={server.server}
                    quality={server.quality}
                    isActive={index === activeServerIndex}
                    onClick={() => setActiveServerIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Movie Info - Right Sidebar */}
          <div className="flex flex-col space-y-6">
            {/* Movie Title & Rating */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
              <h1 className="text-3xl font-bold text-white mb-4">
                {movie?.title || "Movie Title"}
              </h1>

              {/* Meta Information */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 text-white/80">
                  <Calendar className="w-5 h-5" />
                  <span className="text-base font-medium">
                    {movie?.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  <span className="text-white text-lg font-semibold">
                    {movie?.vote_average?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-white/60 text-base">/ 10</span>
                </div>
                {movie?.runtime && (
                  <div className="flex items-center gap-3 text-white/80">
                    <Clock className="w-5 h-5" />
                    <span className="text-base font-medium">
                      {formatRuntime(movie.runtime)}
                    </span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {movie?.genres && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.slice(0, 3).map((genre: any) => (
                    <span
                      key={genre.id}
                      className="rounded-full px-4 py-2 text-xs font-semibold bg-white/10 text-white/90 border border-white/20 hover:bg-white/15 transition"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Overview */}
            {movie?.overview && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex-grow">
                <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
                <p className="text-white/70 leading-relaxed text-base">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* Additional Info - Aligned to bottom */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
              <div className="space-y-5">
                {movie?.production_companies &&
                  movie.production_companies.length > 0 && (
                    <div>
                      <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2 font-semibold">
                        Production
                      </h4>
                      <p className="text-white font-medium text-base">
                        {movie.production_companies[0].name}
                      </p>
                    </div>
                  )}
                {movie?.budget && movie.budget > 0 && (
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2 font-semibold">
                      Budget
                    </h4>
                    <p className="text-white font-medium text-base">
                      ${(movie.budget / 1000000).toFixed(1)}M
                    </p>
                  </div>
                )}
                {movie?.revenue && movie.revenue > 0 && (
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2 font-semibold">
                      Revenue
                    </h4>
                    <p className="text-white font-medium text-base">
                      ${(movie.revenue / 1000000).toFixed(1)}M
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
