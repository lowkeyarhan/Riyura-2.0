"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  User,
  Clock,
  Film,
  Tv,
  ChevronRight,
  Edit2,
  Shield,
  CreditCard,
  Play,
  Star,
  Key,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase";
import { getWatchlist } from "@/src/lib/database";

// Cache Configuration
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const RECOMMENDATIONS_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (effectively infinite)

const CACHE_KEYS = {
  WATCH_HISTORY: "profile_watch_history",
  WATCHLIST: "profile_watchlist",
  STATS: "profile_stats",
  API_KEY: "profile_api_key",
  RECOMMENDATIONS: "profile_recommendations",
};

const INITIAL_STATS = [
  { label: "Movies", value: "0", icon: Film, color: "text-cyan-400" },
  { label: "Series", value: "0", icon: Tv, color: "text-orange-400" },
  { label: "Hours", value: "0", icon: Clock, color: "text-purple-400" },
];

const SETTINGS_LINKS = [
  { label: "Account Settings", icon: User, desc: "Personal info, Email" },
  { label: "Subscription Plan", icon: CreditCard, desc: "Manage Premium" },
  {
    label: "Gemini API Key",
    icon: Key,
    desc: "Manage AI Integration",
    hasInput: true,
  },
  { label: "Privacy & Security", icon: Shield, desc: "Password, 2FA" },
];

// Cache Utilities (using localStorage for persistence across sessions)
const getCacheKey = (userId: string, type: string) => `${type}_${userId}`;

const isCacheValid = (timestamp: number, duration: number) => {
  return Date.now() - timestamp < duration;
};

const getCachedData = (
  cacheKey: string,
  duration: number = DEFAULT_CACHE_DURATION
) => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) {
      console.log(`📦 [Cache] No cached data for: ${cacheKey}`);
      return null;
    }

    const { data, timestamp } = JSON.parse(cached);
    if (!isCacheValid(timestamp, duration)) {
      console.log(`⏰ [Cache] Expired cache for: ${cacheKey}`);
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log(`✅ [Cache] Using cached data for: ${cacheKey}`);
    return data;
  } catch (error) {
    console.warn(`⚠️  [Cache] Error reading cache for: ${cacheKey}`, error);
    localStorage.removeItem(cacheKey);
    return null;
  }
};

const setCachedData = (cacheKey: string, data: any) => {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
    console.log(`💾 [Cache] Saved to cache: ${cacheKey}`);
  } catch (error) {
    console.warn(`⚠️  [Cache] Error saving to cache: ${cacheKey}`, error);
  }
};

const clearUserCache = (userId: string) => {
  const keys = Object.values(CACHE_KEYS).map((type) =>
    getCacheKey(userId, type)
  );
  keys.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`🗑️  [Cache] Cleared: ${key}`);
  });
  console.log(`🧹 [Cache] All user cache cleared for: ${userId}`);
};

const formatWatchHistory = (data: any[]) => {
  return data.map((item: any) => {
    const totalLength = item.episode_length || 7200;
    const progress = Math.min(
      100,
      Math.round((item.duration_sec / totalLength) * 100)
    );
    const remainingSeconds = Math.max(0, totalLength - item.duration_sec);

    return {
      id: item.id,
      tmdbId: item.tmdb_id,
      title: item.title,
      progress,
      image: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      type:
        item.media_type === "movie"
          ? "Movie"
          : item.episode_name
          ? `S${item.season_number} E${item.episode_number}: ${item.episode_name}`
          : `S${item.season_number} E${item.episode_number}`,
      year: item.release_date
        ? new Date(item.release_date).getFullYear()
        : null,
      remaining: `${Math.floor(remainingSeconds / 60)}m remaining`,
      mediaType: item.media_type,
      seasonNumber: item.season_number,
      episodeNumber: item.episode_number,
      streamId: item.stream_id,
    };
  });
};

const calculateStats = (data: any[]) => {
  const moviesCount = data.filter((i: any) => i.media_type === "movie").length;
  const seriesCount = new Set(
    data.filter((i: any) => i.media_type !== "movie").map((i: any) => i.tmdb_id)
  ).size;
  const totalSeconds = data.reduce(
    (acc: number, item: any) => acc + (item.duration_sec || 0),
    0
  );
  const hoursCount = Math.round(totalSeconds / 3600);

  return [
    { ...INITIAL_STATS[0], value: moviesCount.toString() },
    { ...INITIAL_STATS[1], value: seriesCount.toString() },
    { ...INITIAL_STATS[2], value: hoursCount.toString() },
  ];
};

// --- Sub-Components ---
const StatBadge = ({ stat }: { stat: (typeof INITIAL_STATS)[0] }) => (
  <div className="flex flex-col items-center p-4 rounded-2xl bg-[#29292930] border border-white/5 flex-1 group hover:border-white/10 hover:bg-[#29292950] transition-colors">
    <span className="text-xl font-bold text-white leading-none mb-1">
      {stat.value}
    </span>
    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold group-hover:text-gray-400 transition-colors">
      {stat.label}
    </span>
  </div>
);

const SettingsLink = ({ item }: { item: (typeof SETTINGS_LINKS)[0] }) => (
  <div className="w-full">
    <div className="w-full bg-[#1518215f] border border-white/5 rounded-xl hover:bg-[#15182180] hover:border-white/20 transition-all group text-left shadow-sm p-4 flex flex-col min-h-[80px] justify-center">
      <div className="flex items-center gap-4 w-full">
        <div className="p-2.5 rounded-lg text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all flex-shrink-0">
          <item.icon size={18} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
            {item.label}
          </h4>
          <p className="text-xs text-gray-500">{item.desc}</p>
        </div>
      </div>
    </div>
  </div>
);

// Gemini API Key Input Component (with debouncing)
const GeminiApiKeyInput = ({
  value,
  onChange,
  onSave,
  onDelete,
  isLoading,
  isSaving,
  keyPreview,
  hasKey,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: (key: string) => void;
  onDelete: () => void;
  isLoading: boolean;
  isSaving: boolean;
  keyPreview: string | null;
  hasKey: boolean;
}) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer (3 seconds)
    debounceTimerRef.current = setTimeout(() => {
      if (newValue.trim() === "" && hasKey) {
        // Empty input with existing key = delete
        onDelete();
      } else if (newValue.trim() !== "") {
        // Non-empty input = save
        onSave(newValue.trim());
      }
    }, 3000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div className="w-full bg-[#1518215f] border border-white/5 rounded-xl hover:bg-[#15182180] hover:border-white/20 transition-all group text-left shadow-sm p-4 flex flex-col min-h-[80px] justify-center">
        <div className="flex items-start gap-4 w-full">
          <div className="p-2.5 rounded-lg text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all flex-shrink-0">
            <Key size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
              Gemini API Key
            </h4>
            <p className="text-xs text-gray-500">Manage AI Integration</p>
            <div className="relative mt-4">
              <input
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder={isLoading ? "Loading..." : "Enter Gemini API Key"}
                disabled={isLoading || isSaving}
                className="w-full rounded-lg bg-transparent border border-white/5 text-white px-3 py-2.5 pr-12 focus:outline-none focus:border-white/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSaving && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                )}
                {hasKey && !isSaving && (
                  <div className="text-green-500 text-xs font-bold">✓</div>
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              Changes auto-save after 3 seconds. Clear input to delete key.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContinueWatchingCard = ({
  item,
  onClick,
}: {
  item: any;
  onClick: () => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 0, scale: 0.95 }}
    animate={{
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }}
    exit={{
      opacity: 0,
      y: 0,
      scale: 0.95,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    }}
    onClick={onClick}
    className="group relative flex items-center gap-5 p-4 bg-[#1518215f] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-[#15182180] transition-all cursor-pointer overflow-hidden shadow-lg hover:shadow-xl hover:shadow-black/20"
  >
    <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-[#0f1115] flex-shrink-0 shadow-inner">
      <Image
        src={item.image}
        alt={item.title}
        fill
        className="object-cover transition-transform duration-500"
        sizes="(max-width: 768px) 50vw, 160px"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
          <Play className="w-4 h-4 fill-black text-black ml-0.5" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-orange-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
          style={{ width: `${item.progress}%` }}
        />
      </div>
    </div>
    <div className="flex-1 min-w-0 py-1">
      <h4
        className="text-lg font-bold text-white truncate mb-1 group-hover:text-red-500 transition-colors"
        style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
      >
        {item.title}
      </h4>
      <p className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-2">
        <span className="bg-white/10 px-2 py-0.5 rounded text-gray-300">
          {item.type}
        </span>
        {item.type?.toLowerCase().includes("movie") && item.year && (
          <span className="text-gray-600">• {item.year}</span>
        )}
      </p>
      <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
        <span className="text-gray-300">{item.progress}% completed</span>
        <span className="w-1 h-1 rounded-full bg-gray-600" />
        <span>{item.remaining}</span>
      </div>
    </div>
    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-[#0f1115] border border-white/5 text-gray-500 group-hover:text-white group-hover:border-white/20 transition-all">
      <Play size={16} fill="currentColor" />
    </div>
  </motion.div>
);

const WatchlistCard = ({
  item,
  onClick,
}: {
  item?: any;
  onClick?: () => void;
}) => {
  if (!item) {
    return (
      <div className="group relative aspect-[2/3] bg-[#1518215f] border border-white/5 rounded-xl hover:border-white/10 hover:bg-[#15182170] overflow-hidden cursor-pointer shadow-md transition-all duration-300">
        <div className="absolute inset-0">
          <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-bold tracking-widest">
            POSTER
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0f1115]/90 border border-white/10 shadow-sm">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold text-white">8.5</span>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-3">
            <div className="w-3/4 h-3 bg-white/10 rounded mb-2" />
            <div className="w-1/2 h-2 bg-white/5 rounded" />
          </div>
        </div>
        <div className="absolute inset-0 bg-[#0f1115]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-black ml-0.5" />
          </div>
        </div>
      </div>
    );
  }

  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;
  const year = item.release_date
    ? new Date(item.release_date).getFullYear()
    : null;

  return (
    <div
      className="group relative aspect-[2/3] bg-[#1518215f] border border-white/5 rounded-xl hover:border-white/10 hover:bg-[#15182170] overflow-hidden cursor-pointer shadow-md transition-all duration-300"
      onClick={onClick}
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-bold tracking-widest">
          NO IMAGE
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <h4 className="text-sm font-bold text-white line-clamp-2 mb-1">
          {item.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          {year && <span>{year}</span>}
          {item.media_type === "tv" && item.number_of_seasons && (
            <span>{item.number_of_seasons} seasons</span>
          )}
        </div>
      </div>
      <div className="absolute inset-0 bg-[#0f1115]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
          <Play className="w-4 h-4 fill-black ml-0.5" />
        </div>
      </div>
    </div>
  );
};

// Recommendation Card (identical to watchlist card)
const RecommendationCard = ({
  item,
  onClick,
}: {
  item: any;
  onClick?: () => void;
}) => {
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;
  const year = item.release_date
    ? new Date(item.release_date).getFullYear()
    : null;

  return (
    <div
      className="group relative aspect-[2/3] bg-[#1518215f] border border-white/5 rounded-xl hover:border-white/10 hover:bg-[#15182170] overflow-hidden cursor-pointer shadow-md transition-all duration-300"
      onClick={onClick}
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-bold tracking-widest">
          NO IMAGE
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <h4 className="text-sm font-bold text-white line-clamp-2 mb-1">
          {item.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          {year && <span>{year}</span>}
          {item.media_type === "tv" && item.number_of_seasons && (
            <span>{item.number_of_seasons} seasons</span>
          )}
        </div>
      </div>
      <div className="absolute inset-0 bg-[#0f1115]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
          <Play className="w-4 h-4 fill-black ml-0.5" />
        </div>
      </div>
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="relative h-screen bg-black text-white font-sans overflow-hidden">
    <div className="relative z-10 w-full h-full pt-32 pb-16 px-8 md:px-16 lg:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-4 flex flex-col justify-between lg:sticky lg:top-32 h-[calc(100vh-8rem)]">
          <div className="bg-[#1518215f] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl animate-pulse">
            <div className="flex flex-col items-center text-center mt-4">
              <div className="w-28 h-28 mb-5 rounded-full bg-white/10" />
              <div className="h-8 w-32 bg-white/10 rounded-lg mb-2" />
              <div className="h-4 w-48 bg-white/5 rounded-lg mb-8" />
              <div className="flex gap-3 w-full mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 flex-1 rounded-2xl bg-white/5" />
                ))}
              </div>
              <div className="w-full h-12 rounded-xl bg-white/5" />
            </div>
          </div>
          <div className="space-y-3 mt-6 mb-2">
            <div className="h-4 w-24 bg-white/5 rounded mb-4" />
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full h-20 bg-[#1518215f] border border-white/5 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
        {/* Right Column Skeleton */}
        <div className="lg:col-span-8 space-y-10 overflow-hidden pr-2">
          <div className="flex flex-col items-start gap-3 animate-pulse">
            <div className="h-12 w-64 bg-white/10 rounded-xl" />
            <div className="h-5 w-48 bg-white/5 rounded-lg" />
          </div>
          {[1, 2, 3].map((section) => (
            <div key={section} className="space-y-5">
              <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
              <div
                className={`grid grid-cols-2 ${
                  section === 1 ? "" : "sm:grid-cols-4"
                } gap-5`}
              >
                {section === 1
                  ? [1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-full h-40 bg-[#1518215f] border border-white/5 rounded-2xl animate-pulse"
                      />
                    ))
                  : [1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="aspect-[2/3] bg-[#1518215f] border border-white/5 rounded-xl animate-pulse"
                      />
                    ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- Main Page Component ---
export default function ProfilePage() {
  const { user, loading, firstName, avatarUrl } = useAuth();
  const router = useRouter();
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [showAllWatching, setShowAllWatching] = useState(false);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  const fetchingRef = useRef(false);
  const apiKeyFetchingRef = useRef(false);
  const recommendationsFetchingRef = useRef(false);
  const recommendationsDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Gemini API Key state
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyPreview, setApiKeyPreview] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(true);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [recommendationsError, setRecommendationsError] = useState<
    string | null
  >(null);

  // Auth Guard
  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  // Data Fetching
  useEffect(() => {
    if (!user || fetchingRef.current || dataInitialized) return;

    const fetchAllData = async () => {
      if (fetchingRef.current) {
        return;
      }
      fetchingRef.current = true;

      // 1. Load History & Stats
      try {
        setIsLoadingHistory(true);
        const historyKey = getCacheKey(user.id, CACHE_KEYS.WATCH_HISTORY);
        const statsKey = getCacheKey(user.id, CACHE_KEYS.STATS);

        const cachedHistory = getCachedData(historyKey);
        const cachedStats = getCachedData(statsKey);

        if (cachedHistory && cachedStats) {
          setContinueWatching(cachedHistory);
          setStats(cachedStats);
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            const res = await fetch("/api/watch-history", {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
              const { data } = await res.json();
              const formattedStats = calculateStats(data);
              const formattedHistory = formatWatchHistory(data);
              setStats(formattedStats);
              setContinueWatching(formattedHistory);
              setCachedData(statsKey, formattedStats);
              setCachedData(historyKey, formattedHistory);
            }
          }
        }
      } catch (error) {
        // silent fail
      } finally {
        setIsLoadingHistory(false);
      }

      // 2. Load Watchlist
      try {
        setIsLoadingWatchlist(true);
        const watchlistKey = getCacheKey(user.id, CACHE_KEYS.WATCHLIST);
        const cachedWatchlist = getCachedData(watchlistKey);

        if (cachedWatchlist) {
          setWatchlist(cachedWatchlist);
        } else {
          const data = await getWatchlist(user.id);
          setWatchlist(data);
          setCachedData(watchlistKey, data);
        }
      } catch (error) {
        // silent fail
      } finally {
        setIsLoadingWatchlist(false);
      }

      setDataInitialized(true);
      fetchingRef.current = false;
    };

    fetchAllData();
  }, [user]);

  // Fetch API Key Status on mount
  useEffect(() => {
    if (!user || apiKeyFetchingRef.current) return;

    const fetchApiKeyStatus = async () => {
      if (apiKeyFetchingRef.current) return;
      apiKeyFetchingRef.current = true;

      try {
        setIsLoadingApiKey(true);
        const apiKeyCache = getCacheKey(user.id, CACHE_KEYS.API_KEY);
        const cached = getCachedData(apiKeyCache);

        if (cached) {
          // Use cached data
          setHasApiKey(cached.hasKey);
          setApiKeyPreview(cached.keyPreview);
          if (cached.keyPreview) {
            setApiKeyInput(cached.keyPreview);
          }
          setIsLoadingApiKey(false);
          apiKeyFetchingRef.current = false;
          return;
        }

        // Fetch from API
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const res = await fetch("/api/gemini", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (res.ok) {
            const data = await res.json();
            setHasApiKey(data.hasKey);
            setApiKeyPreview(data.keyPreview);
            if (data.keyPreview) {
              setApiKeyInput(data.keyPreview);
            }

            // Cache the result
            setCachedData(apiKeyCache, {
              hasKey: data.hasKey,
              keyPreview: data.keyPreview,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch API key status:", error);
      } finally {
        setIsLoadingApiKey(false);
        apiKeyFetchingRef.current = false;
      }
    };

    fetchApiKeyStatus();
  }, [user]);

  // Shared fetch function with strict locking
  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      if (!user || !hasApiKey) return;

      // Prevent duplicate calls if already fetching
      if (recommendationsFetchingRef.current) {
        console.log(`🚫 [Recommendations] Already fetching, skipping call`);
        return;
      }

      try {
        recommendationsFetchingRef.current = true;
        setIsLoadingRecommendations(true);
        setRecommendationsError(null);

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cacheKey = getCacheKey(user.id, CACHE_KEYS.RECOMMENDATIONS);
          const cached = getCachedData(
            cacheKey,
            RECOMMENDATIONS_CACHE_DURATION
          );

          if (cached) {
            setRecommendations(cached);
            setIsLoadingRecommendations(false);
            recommendationsFetchingRef.current = false;
            console.log(
              `✅ [Recommendations] Loaded ${cached.length} from cache`
            );
            return;
          }
        }

        console.log(`🎬 [Recommendations] Fetching for user: ${user.id}`);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const res = await fetch("/api/gemini/recommendations", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (res.ok) {
            const data = await res.json();
            setRecommendations(data.recommendations || []);

            // Cache the recommendations
            const cacheKey = getCacheKey(user.id, CACHE_KEYS.RECOMMENDATIONS);
            setCachedData(cacheKey, data.recommendations || []);

            console.log(
              `✅ [Recommendations] Fetched ${
                data.recommendations?.length || 0
              } recommendations`
            );
          } else {
            const error = await res.json();
            setRecommendationsError(
              error.error || "Failed to load recommendations"
            );
            console.error(`❌ [Recommendations] Error:`, error.error);
          }
        }
      } catch (error) {
        console.error(`🔥 [Recommendations] Failed:`, error);
        setRecommendationsError("Failed to load recommendations");
      } finally {
        setIsLoadingRecommendations(false);
        recommendationsFetchingRef.current = false;
      }
    },
    [user, hasApiKey]
  );

  // Initial Fetch Effect
  useEffect(() => {
    if (!user || !hasApiKey || isLoadingApiKey) return;

    // Only fetch if not already loaded and not fetching
    if (recommendations.length === 0 && !recommendationsFetchingRef.current) {
      fetchRecommendations(false);
    }
  }, [
    user,
    hasApiKey,
    isLoadingApiKey,
    fetchRecommendations,
    recommendations.length,
  ]);

  // Refs to track previous lengths for change detection
  const prevWatchlistLengthRef = useRef<number | null>(null);
  const prevHistoryLengthRef = useRef<number | null>(null);

  // Auto-refresh recommendations when watchlist/history changes (with 3s debounce)
  useEffect(() => {
    if (!user || !hasApiKey || isLoadingApiKey || !dataInitialized) return;

    const currentWatchlistLen = watchlist.length;
    const currentHistoryLen = continueWatching.length;

    // Initialize refs on first valid run
    if (prevWatchlistLengthRef.current === null) {
      prevWatchlistLengthRef.current = currentWatchlistLen;
      prevHistoryLengthRef.current = currentHistoryLen;
      return;
    }

    // Check if data actually changed
    const hasChanged =
      currentWatchlistLen !== prevWatchlistLengthRef.current ||
      currentHistoryLen !== prevHistoryLengthRef.current;

    if (!hasChanged) return;

    // Update refs
    prevWatchlistLengthRef.current = currentWatchlistLen;
    prevHistoryLengthRef.current = currentHistoryLen;

    // Clear existing debounce timer
    if (recommendationsDebounceRef.current) {
      clearTimeout(recommendationsDebounceRef.current);
    }

    // Set new debounce timer (3 seconds)
    console.log(
      `⏱️  [Recommendations] Data changed (Watchlist: ${currentWatchlistLen}, History: ${currentHistoryLen}). Refresh in 3s...`
    );

    recommendationsDebounceRef.current = setTimeout(() => {
      console.log(`🔄 [Recommendations] Auto-refresh triggered by data change`);
      fetchRecommendations(true); // Force refresh
    }, 3000);

    // Cleanup on unmount
    return () => {
      if (recommendationsDebounceRef.current) {
        clearTimeout(recommendationsDebounceRef.current);
      }
    };
  }, [
    user,
    hasApiKey,
    isLoadingApiKey,
    dataInitialized,
    continueWatching.length,
    watchlist.length,
    fetchRecommendations,
  ]);

  // Expose refresh function for manual refresh
  const refreshRecommendations = useCallback(async () => {
    fetchRecommendations(true);
  }, [fetchRecommendations]);

  // Handler: Save API Key
  const handleSaveApiKey = async (key: string) => {
    if (!user) return;

    try {
      setIsSavingApiKey(true);
      console.log(
        `🔐 [API Key] Attempting to save API key for user: ${user.id}`
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey: key }),
        });

        if (res.ok) {
          const data = await res.json();
          setHasApiKey(true);
          setApiKeyPreview(data.keyPreview);
          setApiKeyInput(data.keyPreview);

          // Update cache
          const apiKeyCache = getCacheKey(user.id, CACHE_KEYS.API_KEY);
          setCachedData(apiKeyCache, {
            hasKey: true,
            keyPreview: data.keyPreview,
          });

          console.log(`✅ [API Key] API key saved successfully`);
        } else {
          const error = await res.json();
          console.error(`❌ [API Key] Failed to save:`, error.error);
          alert(`Failed to save API key: ${error.error}`);
        }
      }
    } catch (error) {
      console.error(`🔥 [API Key] Error saving API key:`, error);
      alert("Failed to save API key. Please try again.");
    } finally {
      setIsSavingApiKey(false);
    }
  };

  // Handler: Delete API Key
  const handleDeleteApiKey = async () => {
    if (!user) return;

    try {
      setIsSavingApiKey(true);
      console.log(
        `🗑️  [API Key] Attempting to delete API key for user: ${user.id}`
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const res = await fetch("/api/gemini", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (res.ok) {
          setHasApiKey(false);
          setApiKeyPreview(null);
          setApiKeyInput("");

          // Clear cache
          const apiKeyCache = getCacheKey(user.id, CACHE_KEYS.API_KEY);
          localStorage.removeItem(apiKeyCache);
          console.log(`✅ [API Key] API key deleted successfully`);
        } else {
          const error = await res.json();
          console.error(`❌ [API Key] Failed to delete:`, error.error);
        }
      }
    } catch (error) {
      console.error(`🔥 [API Key] Error deleting API key:`, error);
    } finally {
      setIsSavingApiKey(false);
    }
  };

  // Handlers
  const handleSignOut = async () => {
    setIsSignOutLoading(true);

    // Clear ALL user cache from localStorage on logout
    if (user) {
      console.log(`🚪 [Sign Out] Clearing cache for user: ${user.id}`);
      clearUserCache(user.id);
    }

    // Reset states
    setDataInitialized(false);
    fetchingRef.current = false;
    apiKeyFetchingRef.current = false;

    await supabase.auth.signOut();
    console.log(`✅ [Sign Out] User signed out successfully`);
    router.push("/landing");
  };

  const handlePlayClick = useCallback(
    (item: any) => {
      if (item.mediaType === "movie") {
        const url = `/player/movie/${item.tmdbId}${
          item.streamId ? `?stream=${item.streamId}` : ""
        }`;
        router.push(url);
      } else {
        const params = new URLSearchParams();
        if (item.streamId) params.set("stream", item.streamId);
        if (item.seasonNumber)
          params.set("season", item.seasonNumber.toString());
        if (item.episodeNumber)
          params.set("episode", item.episodeNumber.toString());
        router.push(
          `/player/tvshow/${item.tmdbId}${
            params.toString() ? `?${params.toString()}` : ""
          }`
        );
      }
    },
    [router]
  );

  if (loading || !user) return <ProfileSkeleton />;

  return (
    <div className="relative h-screen bg-black text-white font-sans overflow-hidden">
      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#155f75b5] blur-[130px] opacity-40" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#9a341299] blur-[130px] opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)]" />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full h-full pt-32 pb-16 px-8 md:px-16 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
          {/* --- LEFT COLUMN: Identity & Navigation --- */}
          <div className="lg:col-span-4 flex flex-col justify-between lg:sticky lg:top-32 h-fit">
            <div className="bg-[#1518215f] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
              <div className="relative flex flex-col items-center text-center mt-4">
                <div className="relative w-28 h-28 mb-5 group">
                  <div className="relative w-full h-full rounded-full overflow-hidden border-[1px] shadow-xl">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#0f1115]">
                        <span className="text-3xl font-bold text-gray-600">
                          {(firstName || "U")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 rounded-full bg-[#1a1d29] text-white border border-white/10 shadow-lg hover:bg-white hover:text-black transition-colors">
                    <Edit2 size={14} />
                  </button>
                </div>

                <h2
                  className="text-2xl font-bold text-white mb-1"
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                >
                  {firstName || "User"}
                </h2>
                <p className="text-sm text-gray-400 mb-8">{user.email}</p>

                <div className="flex gap-3 w-full mb-8">
                  {stats.map((stat) => (
                    <StatBadge key={stat.label} stat={stat} />
                  ))}
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={isSignOutLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-red-600/10 border border-red-600/30 text-red-500 font-bold text-sm hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300"
                >
                  {isSignOutLoading ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut size={16} />
                  )}
                  Sign Out
                </button>
              </div>
            </div>

            <div className="space-y-3 mt-6 mb-2">
              <h3 className="px-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                Preferences
              </h3>
              {SETTINGS_LINKS.map((link) =>
                link.hasInput ? (
                  <GeminiApiKeyInput
                    key={link.label}
                    value={apiKeyInput}
                    onChange={setApiKeyInput}
                    onSave={handleSaveApiKey}
                    onDelete={handleDeleteApiKey}
                    isLoading={isLoadingApiKey}
                    isSaving={isSavingApiKey}
                    keyPreview={apiKeyPreview}
                    hasKey={hasApiKey}
                  />
                ) : (
                  <SettingsLink key={link.label} item={link} />
                )
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN: Content Feed --- */}
          <div className="lg:col-span-8 space-y-12 overflow-y-auto max-h-[calc(100vh-8rem)] scrollbar-hide">
            <div className="flex flex-col items-start gap-1">
              <h1
                className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
              >
                Dashboard
              </h1>
              <p className="text-gray-400">Welcome back to your collection.</p>
            </div>

            {/* Continue Watching */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="text-xl font-bold text-white flex items-center gap-3"
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                >
                  Continue Watching
                </h3>
                {!isLoadingHistory && continueWatching.length > 2 && (
                  <button
                    onClick={() => setShowAllWatching(!showAllWatching)}
                    className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    {showAllWatching ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>
              <motion.div layout className="flex flex-col">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                ) : continueWatching.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>
                      No watch history yet. Start watching to see your progress
                      here!
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {(showAllWatching
                      ? continueWatching
                      : continueWatching.slice(0, 2)
                    ).map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{
                          opacity: index < 2 ? 1 : 0,
                          y: index < 2 ? 0 : -20,
                          scale: index < 2 ? 1 : 0.95,
                          zIndex: index < 2 ? 10 : 0,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          zIndex: 10,
                          marginBottom: 16,
                          transition: {
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                            delay: index > 1 ? (index - 2) * 0.08 : 0,
                          },
                        }}
                        exit={{
                          opacity: 0,
                          y: -20,
                          scale: 0.95,
                          height: 0,
                          marginBottom: 0,
                          zIndex: 0,
                          transition: {
                            duration: 0.6,
                            ease: [0.22, 1, 0.36, 1],
                          },
                        }}
                        transition={{
                          layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                        }}
                      >
                        <ContinueWatchingCard
                          item={item}
                          onClick={() => handlePlayClick(item)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>
            </section>

            {/* Watchlist */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="text-xl font-bold text-white flex items-center gap-3"
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                >
                  Watchlist
                </h3>
                <button
                  onClick={() => router.push("/watchlist")}
                  className="flex items-center gap-1 text-sm font-bold text-white/60 hover:text-white transition-colors"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                {isLoadingWatchlist ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <WatchlistCard key={`loading-${i}`} />
                  ))
                ) : watchlist.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>
                      Your watchlist is empty. Start adding movies and shows!
                    </p>
                    <button
                      onClick={() => router.push("/explore")}
                      className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                    >
                      Explore Content
                    </button>
                  </div>
                ) : (
                  watchlist
                    .slice(0, 4)
                    .map((item) => (
                      <WatchlistCard
                        key={item.id}
                        item={item}
                        onClick={() =>
                          router.push(
                            item.media_type === "movie"
                              ? `/details/movie/${item.tmdb_id}`
                              : `/details/tvshow/${item.tmdb_id}`
                          )
                        }
                      />
                    ))
                )}
              </div>
            </section>

            {/* Recommended */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="text-xl font-bold text-white flex items-center gap-3"
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                >
                  Recommended for You
                </h3>
                <div className="flex items-center gap-3">
                  {hasApiKey && !isLoadingRecommendations && (
                    <button
                      onClick={refreshRecommendations}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="Refresh recommendations"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  )}
                  {recommendations.length > 4 && (
                    <button
                      onClick={() => setShowAllRecommended(!showAllRecommended)}
                      className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
                    >
                      {showAllRecommended ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>
              </div>
              {isLoadingRecommendations ||
              recommendationsError ||
              !hasApiKey ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 lg:pb-16">
                  {Array.from({ length: showAllRecommended ? 8 : 4 }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="group relative aspect-[2/3] bg-[#1518215f] border border-white/5 rounded-xl hover:border-white/10 hover:bg-[#15182170] overflow-hidden cursor-pointer shadow-md transition-all duration-300"
                      >
                        <div className="absolute inset-0">
                          <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-bold tracking-widest">
                            {recommendationsError
                              ? "ERROR"
                              : !hasApiKey
                              ? "NO API KEY"
                              : "LOADING"}
                          </div>
                          <div className="absolute top-2 left-2">
                            <span className="bg-white/10 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-lg animate-pulse">
                              AI
                            </span>
                          </div>
                          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0f1115]/90 border border-white/10 shadow-sm">
                            <span className="text-[10px] font-bold text-white">
                              AI
                            </span>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 p-3">
                            <div className="w-3/4 h-3 bg-white/10 rounded mb-2 animate-pulse" />
                            <div className="w-1/2 h-2 bg-white/5 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-[#0f1115]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <Sparkles className="w-4 h-4 text-black" />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="mb-2">
                    No recommendations yet. Watch some content to get
                    personalized suggestions!
                  </p>
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-2 sm:grid-cols-4 gap-5 lg:pb-16"
                >
                  <AnimatePresence mode="popLayout">
                    {(showAllRecommended
                      ? recommendations.slice(0, 8)
                      : recommendations.slice(0, 4)
                    ).map((item, index) => (
                      <motion.div
                        key={`${item.tmdb_id}-${index}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <RecommendationCard
                          item={item}
                          onClick={() =>
                            router.push(
                              item.media_type === "movie"
                                ? `/details/movie/${item.tmdb_id}`
                                : `/details/tvshow/${item.tmdb_id}`
                            )
                          }
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
