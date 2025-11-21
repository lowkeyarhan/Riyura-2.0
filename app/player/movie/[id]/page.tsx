"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Calendar, Star, Clock, Wifi } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase";
import LoadingDots from "@/src/components/LoadingDots";

// Constants
const CACHE_DURATION = 15 * 60 * 1000;
const MIN_WATCH_DURATION = 60;
const WATCH_TIMER_INTERVAL = 1000;

// Types
interface Server {
  id: string;
  server: string;
  link: string;
  quality: string;
}

interface ServerCardProps {
  name: string;
  quality: string;
  isActive: boolean;
  onClick: () => void;
}

// Generate streaming server links
const generateStreamLinks = (tmdbId: string): Server[] => [
  {
    id: "syntherionmovie",
    server: "Syntherion",
    link: `${process.env.NEXT_PUBLIC_VIDSRC_BASE_URL}/movie/${tmdbId}`,
    quality: "1080p",
  },
  {
    id: "ironlinkmovie",
    server: "IronLink",
    link: `${process.env.NEXT_PUBLIC_VIDLINK_BASE_URL}/movie/${tmdbId}`,
    quality: "1080p",
  },
  {
    id: "dormannumovie",
    server: "Dormannu (ads)",
    link: `${process.env.NEXT_PUBLIC_VIDEASY_BASE_URL}/movie/${tmdbId}`,
    quality: "4K",
  },
  {
    id: "nanovuemovie",
    server: "Nanovue",
    link: `${process.env.NEXT_PUBLIC_YTHD_BASE_URL}/movie/${tmdbId}`,
    quality: "1080p",
  },
];

// Server selection card component
function ServerCard({ name, quality, isActive, onClick }: ServerCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl cursor-pointer transition-all ${
        isActive
          ? "bg-red-600/10 border border-red-600/30"
          : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]"
      }`}
      style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive ? "bg-red-600/20" : "bg-white/[0.05]"
          }`}
        >
          <Wifi
            className={`w-4 h-4 ${isActive ? "text-red-500" : "text-white/50"}`}
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
  );
}

export default function MoviePlayer() {
  const params = useParams();
  const { user } = useAuth();
  const movieId = params.id as string;

  // State management
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeServerIndex, setActiveServerIndex] = useState(0);

  // Watch tracking refs
  const watchDuration = useRef(0);
  const watchTimer = useRef<NodeJS.Timeout | null>(null);
  const hasSavedWatch = useRef(false);

  const servers = generateStreamLinks(movieId);

  // Fetch movie details with caching
  useEffect(() => {
    const fetchMovie = async () => {
      const cacheKey = `movie_details_${movieId}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setMovie(data);
            setLoading(false);
            return;
          }
          sessionStorage.removeItem(cacheKey);
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/movie/${movieId}`);
        if (!response.ok) throw new Error("Failed to fetch movie");

        const data = await response.json();
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
        setMovie(data);
      } catch (err) {
        console.error("Error fetching movie:", err);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) fetchMovie();
  }, [movieId]);

  // Watch history tracking
  useEffect(() => {
    watchTimer.current = setInterval(() => {
      watchDuration.current += 1;
    }, WATCH_TIMER_INTERVAL);

    return () => {
      if (watchTimer.current) clearInterval(watchTimer.current);
      if (
        !user ||
        !movie ||
        hasSavedWatch.current ||
        watchDuration.current < MIN_WATCH_DURATION
      )
        return;

      hasSavedWatch.current = true;

      const watchData = {
        user_id: user.id,
        tmdb_id: parseInt(movieId),
        title: movie.title,
        media_type: "movie",
        stream_id: servers[activeServerIndex].id,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        duration_sec: watchDuration.current,
      };

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return;

        fetch("/api/watch-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(watchData),
          keepalive: true,
        }).catch((err) => console.error("Watch history save failed:", err));
      });
    };
  }, [user, movie, movieId, activeServerIndex, servers]);

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatMoney = (amount: number) => `$${(amount / 1000000).toFixed(1)}M`;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "rgb(7, 9, 16)",
          fontFamily: "Be Vietnam Pro, sans-serif",
        }}
      >
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundColor: "rgb(7, 9, 16)",
        fontFamily: "Be Vietnam Pro, sans-serif",
      }}
    >
      <div className="relative px-4 sm:px-6 lg:px-16 pt-24 pb-8 space-y-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player & Servers */}
          <div className="lg:col-span-2 space-y-6">
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

            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                Available Servers
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {servers.map((server, index) => (
                  <ServerCard
                    key={server.id}
                    name={server.server}
                    quality={server.quality}
                    isActive={index === activeServerIndex}
                    onClick={() => setActiveServerIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Movie Info Sidebar */}
          <div className="flex flex-col space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
              <h1 className="text-3xl font-bold text-white mb-4">
                {movie?.title || "Movie Title"}
              </h1>

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

            {movie?.overview && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
                <p className="text-white/70 leading-relaxed text-base">
                  {movie.overview}
                </p>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
              <div className="space-y-5">
                {movie?.production_companies?.[0] && (
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2 font-semibold">
                      Production
                    </h4>
                    <p className="text-white font-medium text-base">
                      {movie.production_companies[0].name}
                    </p>
                  </div>
                )}
                {movie?.budget > 0 && (
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2 font-semibold">
                      Budget
                    </h4>
                    <p className="text-white font-medium text-base">
                      {formatMoney(movie.budget)}
                    </p>
                  </div>
                )}
                {movie?.revenue > 0 && (
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2 font-semibold">
                      Revenue
                    </h4>
                    <p className="text-white font-medium text-base">
                      {formatMoney(movie.revenue)}
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
