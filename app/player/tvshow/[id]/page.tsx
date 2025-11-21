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
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase";
import LoadingDots from "@/src/components/LoadingDots";

// Constants
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const MIN_WATCH_DURATION = 60; // 1 minute in seconds
const WATCH_TIMER_INTERVAL = 1000; // 1 second

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

interface Season {
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
}

interface Episode {
  id: number;
  episode_number: number;
  name: string;
  still_path: string | null;
  air_date: string;
  overview: string;
  runtime: number;
}

// Generate streaming server links
const generateStreamLinks = (
  tmdbId: string,
  season: number,
  episode: number
): Server[] => [
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

// Server selection card component
function ServerCard({ name, quality, isActive, onClick }: ServerCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all
        ${
          isActive
            ? "bg-red-600/10 border border-red-600/30"
            : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]"
        }
      `}
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

export default function TVShowPlayer() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const tvShowId = params.id as string;

  // State management
  const [tvShow, setTvShow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Watch tracking refs
  const watchDuration = useRef(0);
  const watchTimer = useRef<NodeJS.Timeout | null>(null);
  const hasSavedWatch = useRef(false);

  const servers = generateStreamLinks(
    tvShowId,
    selectedSeason,
    selectedEpisode
  );

  // Initialize season/episode from URL params
  useEffect(() => {
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");
    if (season) setSelectedSeason(parseInt(season));
    if (episode) setSelectedEpisode(parseInt(episode));
  }, [searchParams]);

  // Fetch TV show details with caching
  useEffect(() => {
    const fetchTVShow = async () => {
      const cacheKey = `tvshow_details_${tvShowId}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setTvShow(data);
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
        const response = await fetch(`/api/tvshow/${tvShowId}`);
        if (!response.ok) throw new Error("Failed to fetch TV show");

        const data = await response.json();
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
        setTvShow(data);
      } catch (err) {
        console.error("Error fetching TV show:", err);
      } finally {
        setLoading(false);
      }
    };

    if (tvShowId) fetchTVShow();
  }, [tvShowId]);

  // Fetch episodes for selected season
  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const response = await fetch(
          `/api/tvshow/${tvShowId}/season/${selectedSeason}`
        );
        if (!response.ok) return;

        const data = await response.json();
        setEpisodes(data.episodes || []);

        if (data.episodes?.length > 0) {
          setSelectedEpisode(data.episodes[0].episode_number);
          setActiveServerIndex(0);
        }
      } catch (err) {
        console.error("Error fetching episodes:", err);
      }
    };

    if (tvShowId && selectedSeason) fetchEpisodes();
  }, [tvShowId, selectedSeason]);

  // Watch history tracking
  useEffect(() => {
    watchTimer.current = setInterval(() => {
      watchDuration.current += 1;
    }, WATCH_TIMER_INTERVAL);

    return () => {
      if (watchTimer.current) clearInterval(watchTimer.current);
      if (!user || !tvShow || hasSavedWatch.current) return;
      if (watchDuration.current < MIN_WATCH_DURATION) return;

      hasSavedWatch.current = true;

      const watchData = {
        user_id: user.id,
        tmdb_id: parseInt(tvShowId),
        title: `${tvShow.name} - S${selectedSeason}E${selectedEpisode}`,
        media_type: "tv",
        stream_id: servers[activeServerIndex].id,
        poster_path: tvShow.poster_path,
        release_date: tvShow.first_air_date,
        duration_sec: watchDuration.current,
        season_number: selectedSeason,
        episode_number: selectedEpisode,
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
  }, [
    user,
    tvShow,
    tvShowId,
    selectedSeason,
    selectedEpisode,
    activeServerIndex,
    servers,
  ]);

  // Filter seasons and episodes
  const validSeasons = (tvShow?.seasons || []).filter(
    (season: Season) => season.season_number !== 0 && season.episode_count > 0
  );

  const filteredEpisodes = episodes.filter(
    (ep) =>
      ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.episode_number.toString().includes(searchQuery)
  );

  // Helper functions
  const getImageUrl = (path: string | null, width: number, fallback: string) =>
    path ? `https://image.tmdb.org/t/p/w${width}${path}` : fallback;

  const handleSeasonSelect = (seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    setActiveServerIndex(0);
    setSearchQuery("");
  };

  const handleEpisodeSelect = (episodeNumber: number) => {
    setSelectedEpisode(episodeNumber);
    setActiveServerIndex(0);
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

          {/* TV Show Info Sidebar */}
          <div className="flex flex-col space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
              <h1 className="text-3xl font-bold text-white mb-4">
                {tvShow?.name}
              </h1>

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

            {tvShow?.overview && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
                <p className="text-white/70 leading-relaxed text-base">
                  {tvShow.overview}
                </p>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
              <div className="space-y-5">
                {tvShow?.production_companies?.[0] && (
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

        {/* Seasons & Episodes Section */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-white">
              Seasons & Episodes
            </h2>
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
            {/* Seasons List */}
            <div className="flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin h-full">
              {validSeasons.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                  Season information is not available.
                </div>
              ) : (
                validSeasons.map((season: Season) => (
                  <div
                    key={season.season_number}
                    onClick={() => handleSeasonSelect(season.season_number)}
                    className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedSeason === season.season_number
                        ? "bg-red-600/10 border-red-500/40"
                        : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="relative w-[72px] h-[100px] flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={getImageUrl(
                          season.poster_path,
                          300,
                          "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=300&q=80"
                        )}
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
                ))
              )}
            </div>

            {/* Episodes List */}
            <div className="overflow-y-auto pr-2 scrollbar-thin h-full">
              {filteredEpisodes.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/60">
                  No episodes match your search.
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
                  {filteredEpisodes.map((episode) => (
                    <div
                      key={episode.id}
                      onClick={() =>
                        handleEpisodeSelect(episode.episode_number)
                      }
                      className={`group overflow-hidden rounded-xl border transition-all cursor-pointer ${
                        selectedEpisode === episode.episode_number
                          ? "border-red-500/60 bg-red-600/10"
                          : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={getImageUrl(
                            episode.still_path,
                            500,
                            "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=500&q=80"
                          )}
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
                            {new Date(episode.air_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEpisodes.map((episode) => (
                    <div
                      key={episode.id}
                      onClick={() =>
                        handleEpisodeSelect(episode.episode_number)
                      }
                      className={`flex gap-4 rounded-xl border p-3 transition cursor-pointer ${
                        selectedEpisode === episode.episode_number
                          ? "border-red-500/60 bg-red-600/10"
                          : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="relative w-32 h-20 overflow-hidden rounded-lg">
                        <Image
                          src={getImageUrl(
                            episode.still_path,
                            300,
                            "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=500&q=80"
                          )}
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
                          {episode.runtime && <span>{episode.runtime}m</span>}
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
