"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Calendar,
  Star,
  Clock,
  Wifi,
  Film,
  DollarSign,
  Info,
  PlayCircle,
  Server,
} from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase";
import { invalidateProfileCache } from "@/src/lib/database";
import LoadingDots from "@/src/components/LoadingDots";

// --- Constants ---
const CACHE_DURATION = 15 * 60 * 1000;
const MIN_WATCH_DURATION = 60;
const WATCH_TIMER_INTERVAL = 1000;

// --- Stream Links ---
const generateStreamLinks = (tmdbId: string) => [
  {
    id: "ironlinkmovie",
    name: "IronLink",
    quality: "1080p • Fast",
    link: `${process.env.NEXT_PUBLIC_VIDLINK_BASE_URL}/movie/${tmdbId}`,
  },
  {
    id: "syntherionmovie",
    name: "Syntherion",
    quality: "1080p • Subs",
    link: `${process.env.NEXT_PUBLIC_VIDSRC_BASE_URL}/movie/${tmdbId}`,
  },
  {
    id: "dormannumovie",
    name: "Dormannu",
    quality: "4K • Ads",
    link: `${process.env.NEXT_PUBLIC_VIDEASY_BASE_URL}/movie/${tmdbId}`,
  },
  {
    id: "nanovuemovie",
    name: "Nanovue",
    quality: "1080p • Backup",
    link: `${process.env.NEXT_PUBLIC_YTHD_BASE_URL}/movie/${tmdbId}`,
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
          : "bg-[#29292930] border-white/5 hover:bg-[#29292950] hover:border-white/10"
      }
    `}
  >
    <div className="flex items-center gap-3">
      <div
        className={`
        w-8 h-8 rounded-lg flex items-center justify-center transition-colors
        ${
          isActive
            ? "bg-orange-600 text-white"
            : "bg-[#29292930] text-gray-500 group-hover:text-white"
        }
      `}
      >
        <Wifi size={14} />
      </div>
      <div className="text-left">
        <h4
          className={`text-sm font-bold ${
            isActive ? "text-white" : "text-gray-300 group-hover:text-white"
          }`}
        >
          {name}
        </h4>
      </div>
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

export default function MoviePlayer() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeServerIndex, setActiveServerIndex] = useState(0);

  const watchDuration = useRef(0);
  const watchTimer = useRef<NodeJS.Timeout | null>(null);
  const hasSavedWatch = useRef(false);
  const hasInitializedFromQuery = useRef(false);
  const servers = generateStreamLinks(movieId);

  // Refs for tracking current state in cleanup/unload
  const activeServerIndexRef = useRef(activeServerIndex);
  const movieRef = useRef(movie);

  // Update refs on state change
  useEffect(() => {
    activeServerIndexRef.current = activeServerIndex;
    movieRef.current = movie;
  }, [activeServerIndex, movie]);

  // Fetch Logic
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
        } catch (e) {
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/movie/${movieId}`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
        setMovie(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (movieId) fetchMovie();
  }, [movieId]);

  // Read query parameters and set initial stream selection (only once on mount)
  useEffect(() => {
    if (hasInitializedFromQuery.current) return;

    const streamParam = searchParams.get("stream");

    // Set server based on stream_id
    if (streamParam) {
      const serverIndex = servers.findIndex((s) => s.id === streamParam);
      if (serverIndex !== -1) {
        setActiveServerIndex(serverIndex);
      }
    }

    hasInitializedFromQuery.current = true;
  }, [searchParams, servers]);

  // Watch Tracking Logic
  useEffect(() => {
    console.log("⏱️ [Watch Timer] Started");
    watchTimer.current = setInterval(() => {
      watchDuration.current += 1;
    }, WATCH_TIMER_INTERVAL);

    const saveWatchHistory = () => {
      if (
        !user ||
        !movieRef.current ||
        hasSavedWatch.current ||
        watchDuration.current < MIN_WATCH_DURATION
      ) {
        console.log(
          `⚠️ [Watch Timer] Save skipped. Duration: ${watchDuration.current}s (Min: ${MIN_WATCH_DURATION}s)`
        );
        return;
      }

      console.log(
        `💾 [Watch Timer] Saving history. Duration: ${watchDuration.current}s`
      );

      hasSavedWatch.current = true;
      const currentMovie = movieRef.current;
      const currentServer = servers[activeServerIndexRef.current];

      const watchData = {
        user_id: user.id,
        tmdb_id: parseInt(movieId),
        title: currentMovie.title,
        media_type: "movie",
        stream_id: currentServer.id,
        poster_path: currentMovie.poster_path,
        release_date: currentMovie.release_date,
        duration_sec: watchDuration.current,
        episode_length: currentMovie.runtime ? currentMovie.runtime * 60 : null,
      };

      // Use sendBeacon for more reliable unload sending if possible, falling back to fetch
      const blob = new Blob([JSON.stringify(watchData)], {
        type: "application/json",
      });
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
        })
          .then(() => {
            invalidateProfileCache(user.id);
          })
          .catch((err) => console.error("Failed to save watch history", err));
      });
    };

    // Handle browser close / tab close
    const handleBeforeUnload = () => {
      saveWatchHistory();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup on component unmount (navigation)
    return () => {
      if (watchTimer.current) clearInterval(watchTimer.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveWatchHistory();
    };
  }, [user?.id, movieId]);

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
    <div className="min-h-screen w-full bg-black text-white font-sans flex flex-col">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#155f75b5] blur-[130px] opacity-40" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#9a341299] blur-[130px] opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)]" />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row pt-24 lg:pt-20 pb-4 px-4 gap-4 h-auto lg:h-full">
        {/* --- LEFT: CINEMA PLAYER --- */}
        <div className="flex-1 flex flex-col rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group aspect-video lg:aspect-auto">
          {/* The Player */}
          <iframe
            src={servers[activeServerIndex].link}
            className="w-full h-full object-cover"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>

        {/* --- RIGHT: COMMAND CENTER (Fixed Width sidebar) --- */}
        <div className="w-full lg:w-[24rem] flex flex-col gap-4 h-auto lg:h-full lg:min-h-0">
          {/* 1. Info Header Card */}
          <div className="bg-[#1518215f] border border-white/5 rounded-3xl p-5 shadow-xl flex-shrink-0">
            <h1
              className="text-2xl font-bold text-white leading-tight mb-3"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              {movie?.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-4">
              <MetaTag
                icon={Calendar}
                text={movie?.release_date?.split("-")[0] || "N/A"}
              />
              <MetaTag icon={Clock} text={formatRuntime(movie?.runtime || 0)} />
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold text-yellow-500">
                <Star size={12} fill="currentColor" />
                {movie?.vote_average?.toFixed(1)}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {movie?.genres?.slice(0, 3).map((g: any) => (
                <span
                  key={g.id}
                  className="px-2 py-1 rounded text-[10px] font-bold bg-white/5 text-gray-400 border border-white/5 uppercase tracking-wide"
                >
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          {/* 2. Server Selector (Flexible Height) */}
          <div className="bg-[#1518215f] border border-white/5 rounded-3xl p-5 shadow-xl overflow-hidden flex flex-col min-h-[200px] lg:flex-1 lg:min-h-0">
            <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <Server size={14} />
              <span>Select Source</span>
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

          {/* 3. Synopsis */}
          <div className="bg-[#1518215f] border border-white/5 rounded-3xl p-5 shadow-xl flex-shrink-0 max-h-none lg:max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <Info size={14} />
              <span>Synopsis</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {movie?.overview || "No details available."}
            </p>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs">
              <div className="text-gray-500">
                <span className="block font-bold text-gray-400">Budget</span>
                {formatMoney(movie?.budget)}
              </div>
              <div className="text-right text-gray-500">
                <span className="block font-bold text-gray-400">Revenue</span>
                {formatMoney(movie?.revenue)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
