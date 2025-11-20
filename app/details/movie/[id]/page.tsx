"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Play, Heart, Bookmark, X } from "lucide-react";
import Navbar from "@/src/components/navbar";
import Footer from "@/src/components/footer";
import { useAuth } from "@/src/hooks/useAuth";
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
      }

      setIsWatchlisted(!isWatchlisted);
      sessionStorage.removeItem(`watchlist_${user.id}`);
      console.log("💾 Watchlist cache cleared");
    } catch (err) {
      console.error("❌ Error toggling watchlist:", err);
      setIsWatchlisted(!isWatchlisted);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: BG_COLOR }}
      >
        <div className="text-white text-2xl">Loading...</div>
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
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <Navbar />

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

      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={movie.title}
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex flex-col justify-end px-8 md:px-16 lg:px-20 pb-12">
          <div className="max-w-3xl">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
              style={{ fontFamily: FONT }}
            >
              {movie.title}
            </h1>
            <div
              className="flex items-center gap-4 mb-4 text-gray-200"
              style={{ fontFamily: FONT }}
            >
              <span>{new Date(movie.release_date).getFullYear()}</span>
              <span>•</span>
              <span className="font-semibold">
                {movie.vote_average?.toFixed(1) || "N/A"}/10
              </span>
              <span>•</span>
              <span>{formatRuntime(movie.runtime)}</span>
            </div>
            {movie.tagline && (
              <p
                className="text-lg text-gray-300 italic mb-6"
                style={{ fontFamily: FONT }}
              >
                {movie.tagline}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition font-semibold"
                style={{ fontFamily: FONT }}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Watch Trailer
              </button>
              <button
                onClick={() => router.push(`/player/movie/${movie.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition font-semibold"
                style={{ fontFamily: FONT }}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Watch Now
              </button>
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-3 rounded-full transition ${
                  isFavorited
                    ? "bg-red-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Heart
                  className="w-5 h-5"
                  fill={isFavorited ? "currentColor" : "none"}
                />
              </button>
              <button
                onClick={toggleWatchlist}
                className={`p-3 rounded-full transition ${
                  isWatchlisted
                    ? "bg-red-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Bookmark
                  className="w-5 h-5"
                  fill={isWatchlisted ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="px-8 md:px-16 py-16 space-y-8"
        style={{ backgroundColor: BG_COLOR }}
      >
        <section className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02]">
              <h2
                className="text-4xl font-semibold text-white mb-6"
                style={{ fontFamily: FONT }}
              >
                Overview
              </h2>
              <p
                className="text-white/70 leading-relaxed"
                style={{ fontFamily: FONT }}
              >
                {movie.overview}
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] space-y-4">
              <InfoRow
                label="Release Date"
                value={formatDate(movie.release_date)}
              />
              <InfoRow label="Runtime" value={formatRuntime(movie.runtime)} />
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

        <section className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02]">
          <h2
            className="text-4xl font-semibold text-white mb-6"
            style={{ fontFamily: FONT }}
          >
            Cast
          </h2>
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
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
              className="text-4xl font-semibold mb-8 text-white"
              style={{ fontFamily: FONT }}
            >
              More Like This
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {movie.similar.results.slice(0, 5).map((similar) => (
                <div
                  key={similar.id}
                  className="group relative cursor-pointer rounded-2xl overflow-hidden"
                  onClick={() => router.push(`/details/movie/${similar.id}`)}
                >
                  <div className="relative aspect-[2/3]">
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${similar.poster_path}`}
                      alt={similar.title}
                      fill
                      sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
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
      <div className="flex items-center justify-between">
        <span
          className="text-white/60"
          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
        >
          {label}
        </span>
        <span
          className="text-white"
          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
        >
          {value}
        </span>
      </div>
      <div className="h-px bg-white/10" />
    </>
  );
}
