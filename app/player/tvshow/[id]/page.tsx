"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Calendar,
  Star,
  Clock,
  Wifi,
  Play,
  Grid3x3,
  List,
  Search,
  Check,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase";

// Generate stream links based on TV show ID, season, and episode
const generateStreamLinks = (
  tmdbId: string,
  season: number,
  episode: number
) => {
  return [
    {
      id: "syntheriontv",
      server: "Syntherion",
      link: `${process.env.NEXT_PUBLIC_VIDSRC_BASE_URL}/tv/${tmdbId}/${season}/${episode}`,
      quality: "1080p",
    },
    {
      id: "ironlinktv",
      server: "IronLink",
      link: `${process.env.NEXT_PUBLIC_VIDLINK_BASE_URL}/tv/${tmdbId}/${season}/${episode}`,
      quality: "1080p",
    },
    {
      id: "dormannutv",
      server: "Dormannu (ads)",
      link: `${process.env.NEXT_PUBLIC_VIDEASY_BASE_URL}/tv/${tmdbId}/${season}/${episode}`,
      quality: "4K",
    },
    {
      id: "nanovuetv",
      server: "Nanovue",
      link: `${process.env.NEXT_PUBLIC_YTHD_BASE_URL}/tv/${tmdbId}/${season}/${episode}`,
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
  const searchParams = useSearchParams();
  const tvShowId = params.id as string;
  const { user } = useAuth();

  const [tvShow, setTvShow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const hasSavedRef = useRef(false);
  const durationRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get season and episode from URL params or use defaults
  useEffect(() => {
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");
    if (season) setSelectedSeason(parseInt(season));
    if (episode) setSelectedEpisode(parseInt(episode));
  }, [searchParams]);

  const servers = generateStreamLinks(
    tvShowId,
    selectedSeason,
    selectedEpisode
  );

  useEffect(() => {
    const fetchTVShowDetails = async () => {
      try {
        const cacheKey = `tvshow_details_${tvShowId}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            const fifteenMinutes = 15 * 60 * 1000;

            if (age < fifteenMinutes) {
              console.log(
                `✅ TV Show Player: Loaded from SESSION CACHE (${Math.floor(
                  age / 1000
                )}s old) ⚡`
              );
              setTvShow(data);
              setLoading(false);
              return;
            } else {
              sessionStorage.removeItem(cacheKey);
            }
          } catch (e) {
            sessionStorage.removeItem(cacheKey);
          }
        }

        console.log(
          `📺 TV Show Player: Fetching details for ID ${tvShowId}...`
        );
        const startTime = performance.now();
        setLoading(true);
        const response = await fetch(`/api/tvshow/${tvShowId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch TV show details");
        }
        const data = await response.json();
        const endTime = performance.now();
        const loadTime = (endTime - startTime).toFixed(0);
        console.log(
          `✅ TV Show Player: Loaded FRESH from API in ${loadTime}ms`
        );

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );

        setTvShow(data);
      } catch (err) {
        console.error("Error fetching TV show:", err);
      } finally {
        setLoading(false);
      }
    };

    if (tvShowId) {
      fetchTVShowDetails();
    }
  }, [tvShowId]);

  // Fetch episodes for selected season
  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const response = await fetch(
          `/api/tvshow/${tvShowId}/season/${selectedSeason}`
        );
        if (response.ok) {
          const data = await response.json();
          setEpisodes(data.episodes || []);
          if (data.episodes && data.episodes.length > 0) {
            setSelectedEpisode(data.episodes[0].episode_number);
            setActiveServerIndex(0);
          }
        }
      } catch (err) {
        console.error("Error fetching episodes:", err);
      }
    };

    if (tvShowId && selectedSeason) {
      fetchEpisodes();
    }
  }, [tvShowId, selectedSeason]);

  // Watch history tracking - use timer for duration
  useEffect(() => {
    // Start timer when component mounts
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
    }, 1000);
    console.log(
      `⏱️ Watch History: Timer started for TV show ${tvShowId} S${selectedSeason}E${selectedEpisode}`
    );

    // Cleanup function - save watch history when user leaves
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!user || !tvShow || hasSavedRef.current) return;

      // Only save if user watched for at least 1 minute
      if (durationRef.current < 60) {
        console.log(
          `⏭️ Watch History: Skipping save - duration too short (${durationRef.current}s, minimum 1 minute required)`
        );
        return;
      }

      console.log(
        `⏲️ Watch History: Ended watching TV show ${tvShowId} S${selectedSeason}E${selectedEpisode} - Duration: ${
          durationRef.current
        }s (${Math.floor(durationRef.current / 60)}m ${
          durationRef.current % 60
        }s)`
      );

      // Send watch history to API
      const watchData = {
        user_id: user.id,
        tmdb_id: parseInt(tvShowId),
        title: `${tvShow.name} - S${selectedSeason}E${selectedEpisode}`,
        media_type: "tv",
        stream_id: servers[activeServerIndex].id,
        poster_path: tvShow.poster_path,
        release_date: tvShow.first_air_date,
        duration_sec: durationRef.current,
        season_number: selectedSeason,
        episode_number: selectedEpisode,
      };

      console.log(
        `💾 Watch History: Saving to database via server ${servers[activeServerIndex].server}`,
        watchData
      );

      // Mark as saved to prevent duplicate calls
      hasSavedRef.current = true;

      // Get the user's session token
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          console.error("❌ Watch History: No active session");
          return;
        }

        // Send with auth token in header for RLS
        fetch("/api/watch-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(watchData),
          keepalive: true,
        })
          .then((res) => {
            if (res.ok) {
              console.log("✅ Watch History: Successfully saved");
            } else {
              console.error(
                `❌ Watch History: Failed with status ${res.status}`
              );
            }
          })
          .catch((err) => console.error("❌ Watch History: Fetch failed", err));
      });
    };
  }, [
    user,
    tvShow,
    tvShowId,
    selectedSeason,
    selectedEpisode,
    activeServerIndex,
    servers,
  ]);

  const seasons = (tvShow?.seasons || []).filter(
    (season: any) => season.season_number !== 0 && season.episode_count > 0
  );

  const filteredEpisodes = episodes.filter(
    (ep) =>
      ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.episode_number.toString().includes(searchQuery)
  );

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "rgb(7, 9, 16)",
          fontFamily: "Be Vietnam Pro, sans-serif",
        }}
      >
        <div className="text-white text-xl font-semibold">Loading...</div>
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

          {/* TV Show Info - Right Sidebar */}
          <div className="flex flex-col space-y-6 flex-shrink-0">
            {/* TV Show Title & Rating */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
              <h1 className="text-3xl font-bold text-white mb-4">
                {tvShow?.name || "TV Show Title"}
              </h1>

              {/* Meta Information */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 text-white/80">
                  <Calendar className="w-5 h-5" />
                  <span className="text-base font-medium">
                    {tvShow?.first_air_date
                      ? new Date(tvShow.first_air_date).getFullYear()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  <span className="text-white text-lg font-semibold">
                    {tvShow?.vote_average?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-white/60 text-base">/ 10</span>
                </div>
                {tvShow?.episode_run_time?.[0] && (
                  <div className="flex items-center gap-3 text-white/80">
                    <Clock className="w-5 h-5" />
                    <span className="text-base font-medium">
                      {tvShow.episode_run_time[0]}m
                    </span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {tvShow?.genres && (
                <div className="flex flex-wrap gap-2">
                  {tvShow.genres.slice(0, 3).map((genre: any) => (
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
            {tvShow?.overview && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
                <p className="text-white/70 leading-relaxed text-base">
                  {tvShow.overview}
                </p>
              </div>
            )}

            {/* Additional Info */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
              <div className="space-y-5">
                {tvShow?.production_companies &&
                  tvShow.production_companies.length > 0 && (
                    <div>
                      <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2 font-semibold">
                        Production
                      </h4>
                      <p className="text-white font-medium text-base">
                        {tvShow.production_companies[0].name}
                      </p>
                    </div>
                  )}
                {tvShow?.number_of_seasons && (
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2 font-semibold">
                      Seasons
                    </h4>
                    <p className="text-white font-medium text-base">
                      {tvShow.number_of_seasons}
                    </p>
                  </div>
                )}
                {tvShow?.number_of_episodes && (
                  <div>
                    <h4 className="text-white/60 text-xs uppercase tracking-widest mb-2 font-semibold">
                      Episodes
                    </h4>
                    <p className="text-white font-medium text-base">
                      {tvShow.number_of_episodes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seasons & Episodes Section - Full Width */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Seasons & Episodes
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search episodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/[0.05] border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm text-white placeholder-white/40 w-[240px] focus:outline-none focus:border-white/30 focus:bg-white/[0.07]"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition ${
                    viewMode === "grid"
                      ? "bg-red-600 text-white"
                      : "bg-white/[0.05] text-white/60 hover:bg-white/[0.08]"
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition ${
                    viewMode === "list"
                      ? "bg-red-600 text-white"
                      : "bg-white/[0.05] text-white/60 hover:bg-white/[0.08]"
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 h-[500px]">
            <div className="flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin h-full">
              {seasons.length === 0 && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                  Season information is not available.
                </div>
              )}
              {seasons.map((season: any) => {
                const posterSrc = season.poster_path
                  ? `https://image.tmdb.org/t/p/w300${season.poster_path}`
                  : "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=300&q=80";

                return (
                  <div
                    key={season.season_number}
                    onClick={() => {
                      setSelectedSeason(season.season_number);
                      setActiveServerIndex(0);
                      setSearchQuery("");
                    }}
                    className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedSeason === season.season_number
                        ? "bg-red-600/10 border-red-500/40"
                        : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="relative w-[72px] h-[100px] flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={posterSrc}
                        alt={`Season ${season.season_number}`}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-center text-sm">
                      <span className="text-white font-semibold">
                        Season {season.season_number}
                      </span>
                      <span className="text-white/60">
                        {season.episode_count} Episodes
                      </span>
                      {season.air_date && (
                        <span className="text-red-400 text-xs mt-1">
                          {new Date(season.air_date).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overflow-y-auto pr-2 scrollbar-thin h-full">
              <div className="space-y-4">
                {filteredEpisodes.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/60">
                    No episodes match your search.
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
                    {filteredEpisodes.map((episode: any) => {
                      const stillSrc = episode.still_path
                        ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
                        : "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=500&q=80";

                      return (
                        <div
                          key={episode.id}
                          onClick={() => {
                            setSelectedEpisode(episode.episode_number);
                            setActiveServerIndex(0);
                          }}
                          className={`group overflow-hidden rounded-xl border transition-all cursor-pointer ${
                            selectedEpisode === episode.episode_number
                              ? "border-red-500/60 bg-red-600/10"
                              : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <Image
                              src={stillSrc}
                              alt={episode.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 220px"
                              className="object-cover transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                              E{episode.episode_number}
                            </div>
                            {selectedEpisode === episode.episode_number && (
                              <div className="absolute inset-0 flex items-center justify-center bg-red-600/20">
                                <Play className="w-10 h-10 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 space-y-2">
                            <h4 className="text-sm font-semibold text-white line-clamp-2">
                              {episode.name}
                            </h4>
                            {episode.air_date && (
                              <p className="text-xs text-white/50">
                                {new Date(
                                  episode.air_date
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEpisodes.map((episode: any) => {
                      const stillSrc = episode.still_path
                        ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
                        : "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=500&q=80";

                      return (
                        <div
                          key={episode.id}
                          onClick={() => {
                            setSelectedEpisode(episode.episode_number);
                            setActiveServerIndex(0);
                          }}
                          className={`flex gap-4 rounded-xl border p-3 transition cursor-pointer ${
                            selectedEpisode === episode.episode_number
                              ? "border-red-500/60 bg-red-600/10"
                              : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="relative w-32 h-20 overflow-hidden rounded-lg">
                            <Image
                              src={stillSrc}
                              alt={episode.name}
                              fill
                              sizes="128px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col justify-center">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/50">
                              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                                Episode {episode.episode_number}
                              </span>
                              {episode.runtime && (
                                <span>{episode.runtime}m</span>
                              )}
                            </div>
                            <h4 className="text-sm font-semibold text-white line-clamp-1">
                              {episode.name}
                            </h4>
                            {episode.overview && (
                              <p className="text-xs text-white/50 line-clamp-2">
                                {episode.overview}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
