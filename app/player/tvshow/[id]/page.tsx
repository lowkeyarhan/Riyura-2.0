"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Calendar,
  Star,
  Clock,
  Wifi,
  PlayCircle,
  Film,
  Info,
  Server,
  LayoutGrid,
  List,
  Search,
  Play,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase";
import LoadingDots from "@/src/components/LoadingDots";

// --- Constants ---
const CACHE_DURATION = 15 * 60 * 1000;
const MIN_WATCH_DURATION = 60;
const WATCH_TIMER_INTERVAL = 1000;

// --- Stream Links ---
const generateStreamLinks = (tmdbId: string, s: number, e: number) => [
  {
    id: "syntheriontv",
    name: "Syntherion",
    quality: "1080p • Subs",
    link: `${process.env.NEXT_PUBLIC_VIDSRC_BASE_URL}/tv/${tmdbId}/${s}/${e}`,
  },
  {
    id: "ironlinktv",
    name: "IronLink",
    quality: "1080p • Fast",
    link: `${process.env.NEXT_PUBLIC_VIDLINK_BASE_URL}/tv/${tmdbId}/${s}/${e}`,
  },
  {
    id: "dormannutv",
    name: "Dormannu",
    quality: "4K • Ads",
    link: `${process.env.NEXT_PUBLIC_VIDEASY_BASE_URL}/tv/${tmdbId}/${s}/${e}`,
  },
  {
    id: "nanovuetv",
    name: "Nanovue",
    quality: "1080p • Backup",
    link: `${process.env.NEXT_PUBLIC_YTHD_BASE_URL}/tv/${tmdbId}/${s}/${e}`,
  },
];

// --- Components ---

const ServerRow = ({
  name,
  quality,
  isActive,
  onClick,
}: {
  name: string;
  quality: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-between w-full p-3 rounded-xl border cursor-pointer transition-all duration-200 group
      ${
        isActive
          ? "bg-gradient-to-r from-orange-600/10 to-red-600/10 border-orange-500/50"
          : "bg-[#29292930] border-white/5 hover:bg-[#1a1d29] hover:border-white/10"
      }
    `}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          isActive ? "text-orange-600" : " text-gray-500 group-hover:text-white"
        }`}
      >
        <Wifi size={14} />
      </div>
      <span
        className={`text-sm font-bold ${
          isActive ? "text-white" : "text-gray-300 group-hover:text-white"
        }`}
      >
        {name}
      </span>
    </div>
    <span
      className={`text-[10px] font-bold uppercase tracking-wider ${
        isActive ? "text-orange-500" : "text-gray-600"
      }`}
    >
      {quality}
    </span>
  </button>
);

const MetaTag = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0f1115] border border-white/5 text-xs font-medium text-gray-300">
    <Icon size={12} className="text-gray-500" />
    {text}
  </div>
);

export default function TVShowPlayer() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const tvShowId = params.id as string;

  const [tvShow, setTvShow] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const watchDuration = useRef(0);
  const watchTimer = useRef<NodeJS.Timeout | null>(null);
  const hasSavedWatch = useRef(false);
  const hasInitializedFromQuery = useRef(false);
  const servers = generateStreamLinks(
    tvShowId,
    selectedSeason,
    selectedEpisode
  );

  // --- Logic ---
  useEffect(() => {
    const fetchShow = async () => {
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
        } catch (e) {
          sessionStorage.removeItem(cacheKey);
        }
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/tvshow/${tvShowId}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
        setTvShow(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (tvShowId) fetchShow();
  }, [tvShowId]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const res = await fetch(
          `/api/tvshow/${tvShowId}/season/${selectedSeason}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setEpisodes(data.episodes || []);
      } catch (e) {
        console.error(e);
      }
    };
    if (tvShowId) fetchEpisodes();
  }, [tvShowId, selectedSeason]);

  // Read query parameters and set initial selections (only once on mount)
  useEffect(() => {
    if (hasInitializedFromQuery.current) return;

    const streamParam = searchParams.get("stream");
    const seasonParam = searchParams.get("season");
    const episodeParam = searchParams.get("episode");

    // Set season if provided
    if (seasonParam) {
      const season = parseInt(seasonParam);
      if (!isNaN(season) && season > 0) {
        setSelectedSeason(season);
      }
    }

    // Set episode if provided
    if (episodeParam) {
      const episode = parseInt(episodeParam);
      if (!isNaN(episode) && episode > 0) {
        setSelectedEpisode(episode);
      }
    }

    // Set server based on stream_id
    if (streamParam) {
      const serverIndex = servers.findIndex((s) => s.id === streamParam);
      if (serverIndex !== -1) {
        setActiveServerIndex(serverIndex);
      }
    }

    hasInitializedFromQuery.current = true;
  }, [searchParams, servers]);

  useEffect(() => {
    watchTimer.current = setInterval(() => {
      watchDuration.current += 1;
    }, WATCH_TIMER_INTERVAL);
    return () => {
      if (watchTimer.current) clearInterval(watchTimer.current);
      if (
        !user ||
        !tvShow ||
        hasSavedWatch.current ||
        watchDuration.current < MIN_WATCH_DURATION
      )
        return;
      hasSavedWatch.current = true;
      const currentEpisode = episodes.find(
        (ep) => ep.episode_number === selectedEpisode
      );
      const watchData = {
        user_id: user.id,
        tmdb_id: parseInt(tvShowId),
        title: `${tvShow.name}`,
        media_type: "tv",
        stream_id: servers[activeServerIndex].id,
        poster_path: tvShow.poster_path,
        release_date: tvShow.first_air_date,
        duration_sec: watchDuration.current,
        season_number: selectedSeason,
        episode_number: selectedEpisode,
        episode_name: currentEpisode?.name || null,
        episode_length: currentEpisode?.runtime
          ? currentEpisode.runtime * 60
          : null,
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
        }).then(() => {
          // Invalidate profile cache so it refreshes on next visit
          sessionStorage.removeItem("profile_watch_history");
          sessionStorage.removeItem("profile_stats");
        });
      });
    };
  }, [
    user,
    tvShow,
    selectedSeason,
    selectedEpisode,
    activeServerIndex,
    episodes,
    tvShowId,
    servers,
  ]);

  const validSeasons = (tvShow?.seasons || []).filter(
    (s: any) => s.season_number !== 0 && s.episode_count > 0
  );
  const filteredEpisodes = episodes.filter(
    (ep) =>
      ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.episode_number.toString().includes(searchQuery)
  );
  const getImageUrl = (path: string | null, w: number) =>
    path ? `https://image.tmdb.org/t/p/w${w}${path}` : "/placeholder.jpg";
  const formatRuntime = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
  const formatMoney = (a: number) =>
    a ? `$${(a / 1000000).toFixed(1)}M` : "N/A";

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingDots />
      </div>
    );

  return (
    <div className="w-full bg-black text-white font-sans">
      {/* --- ATMOSPHERE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#155f75b5] blur-[130px] opacity-30" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#9a341299] blur-[130px] opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-150 mix-blend-overlay" />
      </div>

      {/* --- SECTION 1: THEATER (Full Viewport) --- */}
      <div className="relative z-10 h-screen flex flex-col pt-24 pb-6 px-4 md:px-8 lg:px-12 max-w-[1920px] mx-auto">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
          {/* Left: Player (9 cols) */}
          <div className="lg:col-span-9 flex flex-col h-full border border-white/5 rounded-3xl">
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl group">
              <iframe
                src={servers[activeServerIndex].link}
                className="w-full h-full object-contain border border-white/5"
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>

          {/* Right: Sidebar (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4 h-full min-h-0 flex-shrink-0">
            {/* Info Card */}
            <div className="bg-[#1518215f] border border-white/5 rounded-3xl p-5 shadow-xl flex-shrink-0">
              <h1
                className="text-xl md:text-2xl font-bold text-white leading-tight mb-3"
                style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
              >
                {tvShow?.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <MetaTag
                  icon={Calendar}
                  text={tvShow?.first_air_date?.split("-")[0] || "N/A"}
                />
                <MetaTag
                  icon={Clock}
                  text={`${tvShow?.episode_run_time?.[0] || 45}m`}
                />
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold text-yellow-500">
                  <Star size={12} fill="currentColor" />
                  {tvShow?.vote_average?.toFixed(1)}
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {tvShow?.genres?.slice(0, 3).map((g: any) => (
                  <span
                    key={g.id}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-white/5 text-gray-400 border border-white/5 uppercase tracking-wide"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Server Selector (Scrollable) */}
            <div className="flex-1 bg-[#1518215f] border border-white/5 rounded-3xl p-5 shadow-xl overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
                <Server size={14} />
                <span>Source</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2 space-y-2">
                {servers.map((server, index) => (
                  <ServerRow
                    key={server.id}
                    name={server.name}
                    quality={server.quality}
                    isActive={index === activeServerIndex}
                    onClick={() => setActiveServerIndex(index)}
                  />
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <div className="bg-[#1518215f] border border-white/5 rounded-3xl p-5 shadow-xl flex-shrink-0 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                <Info size={14} />
                <span>Synopsis</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {tvShow?.overview || "No details available."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: EPISODE BROWSER (Below Fold, Variable Height) --- */}
      <div className="relative z-10 px-4 md:px-8 lg:px-12 pb-16 max-w-[1920px] mx-auto">
        {/* The h-auto here allows it to shrink/grow based on content, fixing the empty space issue */}
        <div className="flex flex-col bg-[#1518215f] border border-white/5 rounded-3xl overflow-hidden shadow-xl h-auto min-h-[300px]">
          {/* Header */}
          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                Seasons and episodes
              </h3>
              <div className="flex-1 flex justify-center">
                <div className="relative w-full max-w-xs">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#29292930] border border-white/10 rounded-2xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                </div>
              </div>
              <div className="flex rounded-lg p-0.5 border border-white/5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition ${
                    viewMode === "grid"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition ${
                    viewMode === "list"
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_1fr] h-auto">
            {/* Sidebar: Seasons (Sticky) */}
            <div className=" pt-2 px-6 pb-6 h-full max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="flex flex-col gap-4">
                {validSeasons.map((season: any) => {
                  const isActive = selectedSeason === season.season_number;
                  return (
                    <button
                      key={season.season_number}
                      onClick={() => setSelectedSeason(season.season_number)}
                      className={`
                        w-full flex items-center gap-3 p-2 rounded-lg border border-white/5 transition-all group text-left relative overflow-hidden
                        ${
                          isActive
                            ? "bg-white/5 border border-orange-500/30"
                            : "hover:bg-white/5 border border-transparent"
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-orange-500 rounded-r-full" />
                      )}

                      <div className="relative w-8 h-11 flex-shrink-0 overflow-hidden rounded bg-black shadow-sm">
                        <Image
                          src={getImageUrl(season.poster_path, 200)}
                          alt={`S${season.season_number}`}
                          fill
                          className={`object-cover ${
                            isActive
                              ? "opacity-100"
                              : "opacity-70 group-hover:opacity-100"
                          }`}
                        />
                      </div>
                      <div>
                        <span
                          className={`text-xs font-bold block ${
                            isActive
                              ? "text-white"
                              : "text-gray-400 group-hover:text-white"
                          }`}
                        >
                          Season {season.season_number}
                        </span>
                        <span className="text-[10px] text-gray-600 font-medium">
                          {season.episode_count} Eps
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main: Episodes (Height adapts to content) */}
            <div className="pt-2 px-6 pb-6 h-auto border-l border-white/5">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                  {filteredEpisodes.map((ep) => {
                    const isSelected = selectedEpisode === ep.episode_number;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => {
                          setSelectedEpisode(ep.episode_number);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`group relative rounded-lg overflow-hidden cursor-pointer border transition-all ${
                          isSelected
                            ? "border-orange-500/50 shadow-lg ring-1 ring-orange-500/20"
                            : "border-white/5 hover:border-white/20 hover:bg-[#1a1d29]"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-black">
                          <Image
                            src={getImageUrl(ep.still_path, 400)}
                            alt={`${ep.name}`}
                            fill
                            className="object-cover opacity-80 group-hover:opacity-100 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                              <PlayCircle className="text-white drop-shadow-lg w-10 h-10" />
                            </div>
                          )}
                          <span className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                            E{ep.episode_number}
                          </span>
                        </div>
                        {/* Info */}
                        <div className="p-2.5 bg-[#0f1115]">
                          <h4
                            className={`text-xs font-bold line-clamp-1 mb-1 ${
                              isSelected
                                ? "text-orange-400"
                                : "text-gray-200 group-hover:text-white"
                            }`}
                          >
                            {ep.name}
                          </h4>
                          <div className="flex justify-between items-center text-[10px] text-gray-600 font-medium">
                            <span>{ep.runtime ? `${ep.runtime}m` : "N/A"}</span>
                            <span>
                              {ep.air_date
                                ? new Date(ep.air_date).toLocaleDateString()
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredEpisodes.map((ep) => {
                    const isSelected = selectedEpisode === ep.episode_number;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => {
                          setSelectedEpisode(ep.episode_number);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`flex gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-white/5 border-orange-500/30"
                            : "hover:bg-white/5 border-white/5"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-28 h-16 rounded bg-black flex-shrink-0 overflow-hidden border border-white/5">
                          <Image
                            src={getImageUrl(ep.still_path, 300)}
                            alt={ep.name}
                            fill
                            className="object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <PlayCircle className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex flex-col justify-center min-w-0 py-0.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-px rounded ${
                                isSelected
                                  ? "bg-orange-500 text-black"
                                  : "bg-white/10 text-gray-300"
                              }`}
                            >
                              E{ep.episode_number}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {ep.air_date}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold truncate ${
                              isSelected
                                ? "text-orange-400"
                                : "text-gray-200 group-hover:text-white"
                            }`}
                          >
                            {ep.name}
                          </span>
                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                            {ep.overview}
                          </p>
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
  );
}
