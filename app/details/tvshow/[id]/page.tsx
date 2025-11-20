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

interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
  episode_count: number;
  air_date: string;
}

interface TVShow {
  id: number;
  name: string;
  backdrop_path: string;
  poster_path: string;
  first_air_date: string;
  last_air_date?: string;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  tagline: string;
  overview: string;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string }[];
  networks: { id: number; name: string; logo_path: string }[];
  created_by?: { id: number; name: string; profile_path: string }[];
  seasons: Season[];
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
      name: string;
      poster_path: string;
      vote_average: number;
    }[];
  };
}

const BG_COLOR = "rgb(7, 9, 16)";
const FONT = "Be Vietnam Pro, sans-serif";
const CACHE_TTL = 15 * 60 * 1000;

const formatRuntime = (minutes: number[]) => {
  if (!minutes || minutes.length === 0) return "N/A";
  const mins = minutes[0];
  const hours = Math.floor(mins / 60);
  const minsRemainder = mins % 60;
  return hours > 0 ? `${hours}h ${minsRemainder}m` : `${minsRemainder}m`;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <>
    <div className="flex items-center justify-between">
      <span className="text-white/60" style={{ fontFamily: FONT }}>
        {label}
      </span>
      <span className="text-white" style={{ fontFamily: FONT }}>
        {value}
      </span>
    </div>
    <div className="h-px bg-white/10" />
  </>
);

export default function TVShowDetails() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [tvShow, setTVShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTVShowDetails = async () => {
      try {
        const cacheKey = `tvshow_details_${params.id}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              console.log(`✅ TV show loaded from cache`);
              setTVShow(data);
              setLoading(false);
              return;
            }
            sessionStorage.removeItem(cacheKey);
          } catch {
            sessionStorage.removeItem(cacheKey);
          }
        }

        console.log(`📺 Building TV show details for ID ${params.id}...`);
        const response = await fetch(`/api/tvshow/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch TV show details");

        const data = await response.json();
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
        console.log(`✅ TV show built and cached`);

        setTVShow(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTVShowDetails();
    }
  }, [params.id]);

  // Check if TV show is in watchlist when it loads
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (user && tvShow) {
        try {
          const inWatchlist = await isInWatchlist(user.id, tvShow.id, "tv");
          setIsWatchlisted(inWatchlist);
        } catch (err) {
          console.error("Error checking watchlist status:", err);
        }
      }
    };

    checkWatchlistStatus();
  }, [user, tvShow]);

  const handlePlayTrailer = () => {
    setShowTrailer(true);
  };

  const closeTrailer = () => {
    setShowTrailer(false);
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const toggleWatchlist = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (!tvShow) return;

    try {
      if (isWatchlisted) {
        await removeFromWatchlist(user.id, tvShow.id, "tv");
        setIsWatchlisted(false);
        console.log("✅ Removed from watchlist");
      } else {
        await addToWatchlist(user.id, {
          tmdb_id: tvShow.id,
          title: tvShow.name,
          media_type: "tv",
          poster_path: tvShow.poster_path,
          release_date: tvShow.first_air_date,
          vote: tvShow.vote_average,
          number_of_seasons: tvShow.number_of_seasons,
          number_of_episodes: tvShow.number_of_episodes,
        });
        setIsWatchlisted(true);
        console.log("✅ Added to watchlist");
      }

      const cacheKey = `watchlist_${user.id}`;
      sessionStorage.removeItem(cacheKey);
      console.log("💾 Watchlist cache cleared");
    } catch (err) {
      console.error("❌ Error:", err);
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

  if (error || !tvShow) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: BG_COLOR }}
      >
        <div className="text-red-500 text-2xl">
          {error || "TV Show not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <Navbar />

      {/* Trailer Modal */}
      {showTrailer && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95">
          <div className="relative w-[90%] max-w-[1200px] aspect-video">
            <button
              className="absolute -top-12 right-0 z-[2001] text-white hover:text-red-500 transition"
              onClick={closeTrailer}
            >
              <X className="w-8 h-8" />
            </button>
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1`}
              title="TV Show Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={`https://image.tmdb.org/t/p/original${tvShow.backdrop_path}`}
            alt={tvShow.name}
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative h-full flex flex-col justify-end px-8 md:px-16 lg:px-20 pb-12">
          <div className="max-w-3xl">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
              style={{ fontFamily: FONT }}
            >
              {tvShow.name}
            </h1>
            <div
              className="flex items-center gap-4 mb-4 text-gray-200"
              style={{ fontFamily: FONT }}
            >
              <span className="text-lg">
                {new Date(tvShow.first_air_date).getFullYear()}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 fill-yellow-400" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span className="font-semibold">
                  {tvShow.vote_average?.toFixed(1) || "N/A"}/10
                </span>
              </div>
              <span>•</span>
              <span>
                {tvShow.number_of_seasons} Season
                {tvShow.number_of_seasons !== 1 ? "s" : ""} (
                {tvShow.number_of_episodes} Episodes)
              </span>
            </div>
            {tvShow.tagline && (
              <p
                className="text-lg text-gray-300 italic mb-6"
                style={{ fontFamily: FONT }}
              >
                {tvShow.tagline}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handlePlayTrailer}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition font-semibold"
                style={{ fontFamily: FONT }}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Watch Trailer
              </button>
              <button
                onClick={() =>
                  router.push(`/player/tvshow/${tvShow.id}?season=1&episode=1`)
                }
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition font-semibold"
                style={{ fontFamily: FONT }}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Watch Now
              </button>
              <button
                onClick={toggleFavorite}
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

      {/* Content Sections */}
      <div
        className="px-16 sm:px-6 lg:px-16 py-16 space-y-8"
        style={{ backgroundColor: BG_COLOR }}
      >
        {/* Overview */}
        <section className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] ">
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
                {tvShow.overview}
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] space-y-4">
              <InfoRow
                label="First Air Date"
                value={formatDate(tvShow.first_air_date)}
              />

              {tvShow.last_air_date && (
                <InfoRow
                  label="Last Air Date"
                  value={formatDate(tvShow.last_air_date)}
                />
              )}

              {tvShow.episode_run_time &&
                tvShow.episode_run_time.length > 0 && (
                  <InfoRow
                    label="Episode Runtime"
                    value={formatRuntime(tvShow.episode_run_time)}
                  />
                )}

              <InfoRow
                label="Network"
                value={
                  tvShow.networks?.[0]?.name ||
                  tvShow.production_companies?.[0]?.name ||
                  "Unknown"
                }
              />

              {tvShow.production_companies &&
                tvShow.production_companies.length > 0 && (
                  <InfoRow
                    label="Production"
                    value={tvShow.production_companies
                      .slice(0, 2)
                      .map((c) => c.name)
                      .join(", ")}
                  />
                )}

              {tvShow.created_by && tvShow.created_by.length > 0 && (
                <InfoRow
                  label="Created By"
                  value={tvShow.created_by.map((c) => c.name).join(", ")}
                />
              )}

              <div className="flex items-center justify-between">
                <span className="text-white/60" style={{ fontFamily: FONT }}>
                  Genres
                </span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {tvShow.genres?.slice(0, 3).map((genre) => (
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

        {/* Cast Section */}
        <section className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02]">
          <h2
            className="text-4xl font-semibold text-white mb-6"
            style={{ fontFamily: FONT }}
          >
            Cast
          </h2>
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-6">
              {tvShow.credits?.cast?.slice(0, 12).map((person) => (
                <div
                  key={person.id}
                  className="group cursor-pointer flex-shrink-0 w-[180px]"
                >
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

        {/* Seasons Section */}
        {tvShow.seasons && tvShow.seasons.length > 0 && (
          <div className="mb-16">
            <h2
              className="text-4xl font-semibold mb-8 text-white"
              style={{ fontFamily: FONT }}
            >
              Seasons
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tvShow.seasons
                .filter((season) => season.season_number > 0)
                .map((season) => (
                  <div
                    key={season.id}
                    className="flex gap-4 bg-gradient-to-br from-white/10 to-white/[0.02] rounded-2xl overflow-hidden transition cursor-pointer group"
                  >
                    <div className="relative w-28 h-40 flex-shrink-0">
                      {season.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w500${season.poster_path}`}
                          alt={season.name}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-xs text-center p-2">
                          No Poster
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-center">
                      <h3
                        className="text-lg font-semibold text-white mb-2"
                        style={{ fontFamily: FONT }}
                      >
                        {season.name}
                      </h3>
                      <div
                        className="flex items-center gap-3 text-sm text-gray-400"
                        style={{ fontFamily: FONT }}
                      >
                        {season.air_date && (
                          <span>{new Date(season.air_date).getFullYear()}</span>
                        )}
                        <span>•</span>
                        <span>
                          {season.episode_count} Episode
                          {season.episode_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {season.overview && (
                        <p
                          className="text-white/60 text-sm leading-relaxed mt-2 line-clamp-3"
                          style={{ fontFamily: FONT }}
                        >
                          {season.overview}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Similar TV Shows Section */}
        {tvShow.similar?.results?.length > 0 && (
          <div className="mb-12">
            <h2
              className="text-4xl font-semibold mb-8 text-white"
              style={{ fontFamily: FONT }}
            >
              More Like This
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {tvShow.similar.results.slice(0, 5).map((similar) => (
                <div
                  key={similar.id}
                  className="group relative cursor-pointer rounded-2xl overflow-hidden transition-transform duration-300"
                  onClick={() => router.push(`/details/tvshow/${similar.id}`)}
                >
                  <div className="relative aspect-[2/3]">
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${similar.poster_path}`}
                      alt={similar.name}
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
                      {similar.name}
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
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
