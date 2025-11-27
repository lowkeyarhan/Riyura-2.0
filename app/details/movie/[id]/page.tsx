"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Play, Heart, Bookmark, X } from "lucide-react";
import Footer from "@/src/components/footer";
import LoadingDots from "@/src/components/LoadingDots";
import { useAuth } from "@/src/hooks/useAuth";
import { useNotification } from "@/src/lib/NotificationContext";
import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from "@/src/lib/database";

interface Movie {
  id: number;
  title: string;
  backdrop_path: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  runtime: number;
  tagline: string;
  overview: string;
  budget: number;
  revenue: number;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string }[];
  credits: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string;
    }[];
  };
  similar: {
    results: {
      id: number;
      title: string;
      poster_path: string;
      vote_average: number;
    }[];
  };
}

const BG_COLOR = "rgb(7, 9, 16)";
const FONT = "Be Vietnam Pro, sans-serif";
const CACHE_TTL = 15 * 60 * 1000;

const formatRuntime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatMoney = (value: number) => `$${(value / 1000000).toFixed(1)}M`;

export default function MovieDetails() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const cacheKey = `movie_details_${params.id}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              console.log(`✅ Movie loaded from cache`);
              setMovie(data);
              setLoading(false);
              return;
            }
            sessionStorage.removeItem(cacheKey);
          } catch {
            sessionStorage.removeItem(cacheKey);
          }
        }

        console.log(`📽️ Building movie details for ID ${params.id}...`);
        const response = await fetch(`/api/movie/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch movie details");

        const data = await response.json();
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
        console.log(`✅ Movie built and cached`);

        setMovie(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchMovieDetails();
    }
  }, [params.id]);

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (user && movie) {
        try {
          const inWatchlist = await isInWatchlist(user.id, movie.id, "movie");
          setIsWatchlisted(inWatchlist);
        } catch (err) {
          console.error("Error checking watchlist status:", err);
        }
      }
    };

    checkWatchlistStatus();
  }, [user, movie]);

  const toggleWatchlist = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (!movie) return;

    try {
      if (isWatchlisted) {
        await removeFromWatchlist(user.id, movie.id, "movie");
        console.log("✅ Removed from watchlist");
      } else {
        await addToWatchlist(user.id, {
          tmdb_id: movie.id,
          title: movie.title,
          media_type: "movie",
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote: movie.vote_average,
        });
        console.log("✅ Added to watchlist");
        addNotification(`${movie.title} added to watchlist`, "success");
      }

      setIsWatchlisted(!isWatchlisted);
      sessionStorage.removeItem(`watchlist_${user.id}`);
      console.log("💾 Watchlist cache cleared");
    } catch (err) {
      console.error("❌ Error toggling watchlist:", err);
      setIsWatchlisted(!isWatchlisted);
      addNotification("Failed to update watchlist", "error");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: BG_COLOR }}
      >
        <LoadingDots />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: BG_COLOR }}
      >
        <div className="text-red-500 text-2xl">
          {error || "Movie not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black" />

        {/* Mobile Background */}
        <div className="block md:hidden">
          {/* <div className="absolute -top-[10%] -left-[10%] w-[160vw] h-[160vw] rounded-full bg-[#155f75b5] blur-[120px] opacity-40" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[160vw] h-[160vw] rounded-full bg-[#9a341299] blur-[120px] opacity-30 mix-blend-screen" /> */}
        </div>

        {/* Desktop Background */}
        <div className="hidden md:block">
          <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#155f7575] blur-[130px] opacity-40" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#9a341264] blur-[130px] opacity-30 mix-blend-screen" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)]" />
      </div>
      {showTrailer && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95">
          <div className="relative w-[90%] max-w-[1200px] aspect-video">
            <button
              className="absolute -top-12 right-0 z-[2001] text-white hover:text-red-500 transition"
              onClick={() => setShowTrailer(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <iframe
              className="w-full h-full rounded-lg"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="Movie Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* HERO CONTENT */}
      <div className="relative z-10 h-[70vh] min-h-[500px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
          }}
        >
          <Image
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={movie.title}
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        <div className="relative h-full flex flex-col justify-end px-4 md:px-16 lg:px-20 md:pb-12">
          <div className="max-w-3xl">
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
              style={{ fontFamily: FONT }}
            >
              {movie.title}
            </h1>
            {movie.tagline && (
              <p
                className="text-base md:text-lg text-gray-300 italic mb-6"
                style={{ fontFamily: FONT }}
              >
                {movie.tagline}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowTrailer(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white rounded-full transition font-semibold text-sm md:text-base whitespace-nowrap"
                style={{ fontFamily: FONT }}
              >
                <Play className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                Trailer
              </button>
              <button
                onClick={() => router.push(`/player/movie/${movie.id}`)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#3a404f60] hover:bg-white/20 text-white rounded-full transition font-semibold text-sm md:text-base whitespace-nowrap"
                style={{ fontFamily: FONT }}
              >
                <Play className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                Movie
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleWatchlist}
                  className={`p-3 rounded-full transition ${
                    isWatchlisted
                      ? "bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Bookmark
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill={isWatchlisted ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 md:px-16 py-8 md:py-16 space-y-8">
        <section className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-4 bg-[#3a404f60] md:bg-[#1518215f] border border-white/5 rounded-2xl">
              <h2
                className="text-2xl md:text-4xl font-semibold text-white mb-4 md:mb-6"
                style={{ fontFamily: FONT }}
              >
                Overview
              </h2>
              <p
                className="text-white/70 leading-relaxed text-sm md:text-base"
                style={{ fontFamily: FONT }}
              >
                {movie.overview}
              </p>
            </div>
            <div className="p-4 bg-[#3a404f60] md:bg-[#1518215f] border border-white/5 rounded-2xl space-y-4">
              <InfoRow
                label="Release Date"
                value={formatDate(movie.release_date)}
              />
              <InfoRow label="Runtime" value={formatRuntime(movie.runtime)} />
              <InfoRow
                label="IMDb Rating"
                value={movie.vote_average?.toFixed(1) || "N/A"}
              />
              {movie.production_companies?.length > 0 && (
                <InfoRow
                  label="Production"
                  value={movie.production_companies
                    .slice(0, 2)
                    .map((c) => c.name)
                    .join(", ")}
                />
              )}
              {movie.budget > 0 && (
                <InfoRow label="Budget" value={formatMoney(movie.budget)} />
              )}
              {movie.revenue > 0 && (
                <InfoRow label="Revenue" value={formatMoney(movie.revenue)} />
              )}
              <div className="flex items-center justify-between">
                <span className="text-white/60" style={{ fontFamily: FONT }}>
                  Genres
                </span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {movie.genres?.slice(0, 3).map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full px-3 py-1 text-xs font-medium bg-white/15"
                      style={{ fontFamily: FONT }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="p-4 bg-[#3a404f60] md:bg-[#1518215f] border border-white/5 rounded-2xl">
          <h2
            className="text-2xl md:text-4xl font-semibold text-white mb-6"
            style={{ fontFamily: FONT }}
          >
            Cast
          </h2>
          {/* Mobile View: Vertical List */}
          <div className="md:hidden space-y-4">
            {movie.credits?.cast?.slice(0, 12).map((person) => (
              <div key={person.id} className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  {person.profile_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                      alt={person.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                      N/A
                    </div>
                  )}
                </div>
                <div>
                  <p
                    className="text-white font-semibold"
                    style={{ fontFamily: FONT }}
                  >
                    {person.name}
                  </p>
                  <p
                    className="text-white/60 text-sm"
                    style={{ fontFamily: FONT }}
                  >
                    {person.character}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Horizontal Scroll */}
          <div className="hidden md:block overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-6">
              {movie.credits?.cast?.slice(0, 12).map((person) => (
                <div key={person.id} className="flex-shrink-0 w-[180px]">
                  <div className="relative aspect-[2/3] rounded-t-xl overflow-hidden">
                    {person.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                        alt={person.name}
                        fill
                        sizes="180px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 bg-[#1a1a1a] rounded-b-2xl p-4">
                    <p
                      className="text-white text-base font-semibold truncate"
                      style={{ fontFamily: FONT }}
                    >
                      {person.name}
                    </p>
                    <p
                      className="text-white/60 text-sm truncate"
                      style={{ fontFamily: FONT }}
                    >
                      {person.character}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {movie.similar?.results?.length > 0 && (
          <section>
            <h2
              className="text-2xl md:text-4xl font-semibold mb-6 md:mb-8 text-white"
              style={{ fontFamily: FONT }}
            >
              More Like This
            </h2>
            {/* Mobile: Horizontal Scroll */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {movie.similar.results.slice(0, 5).map((similar) => (
                <div
                  key={similar.id}
                  className="group relative cursor-pointer rounded-2xl overflow-hidden flex-shrink-0 w-[140px] md:w-auto"
                  onClick={() => router.push(`/details/movie/${similar.id}`)}
                >
                  <div className="relative aspect-[2/3]">
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${similar.poster_path}`}
                      alt={similar.title}
                      fill
                      sizes="(max-width: 768px) 140px, (max-width: 1024px) 180px, 200px"
                      className="object-cover group-hover:brightness-50 transition-all duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3
                      className="text-base font-bold text-white leading-tight mb-2"
                      style={{ fontFamily: FONT }}
                    >
                      {similar.title}
                    </h3>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <span
                        className="font-semibold text-sm"
                        style={{ fontFamily: FONT }}
                      >
                        {similar.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <span
          className="text-white/60 flex-shrink-0"
          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
        >
          {label}
        </span>
        <span
          className="text-white text-right"
          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
        >
          {value}
        </span>
      </div>
      <div className="h-px bg-white/10" />
    </>
  );
}
