"use client";

import Image from "next/image";
import { useAuth } from "@/src/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
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
  Key, // Imported Key icon
} from "lucide-react";

// --- Mock Data ---
const STATS = [
  { label: "Movies", value: "124", icon: Film, color: "text-cyan-400" },
  { label: "Series", value: "42", icon: Tv, color: "text-orange-400" },
  { label: "Hours", value: "386", icon: Clock, color: "text-purple-400" },
];

const CONTINUE_WATCHING = [
  {
    id: 1,
    title: "Dune: Part Two",
    progress: 75,
    image: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    type: "Movie",
    year: 2024,
    remaining: "24m remaining",
  },
  {
    id: 2,
    title: "Stranger Things",
    progress: 30,
    image: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    type: "S4 E3: The Monster and the Superhero",
    remaining: "32m remaining",
  },
];

const SETTINGS_LINKS = [
  { label: "Account Settings", icon: User, desc: "Personal info, Email" },
  { label: "Subscription Plan", icon: CreditCard, desc: "Manage Premium" },
  { label: "Gemini API Key", icon: Key, desc: "Manage AI Integration" }, // Added Gemini Key
  { label: "Privacy & Security", icon: Shield, desc: "Password, 2FA" },
];

// --- Sub-Components ---

const StatBadge = ({ stat }: { stat: (typeof STATS)[0] }) => (
  <div className="flex flex-col items-center p-4 rounded-2xl bg-[#29292930] border border-white/5 flex-1 group hover:border-white/10 hover:bg-[#29292950] transition-colors">
    <span className="text-xl font-bold text-white leading-none mb-1">
      {stat.value}
    </span>
    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold group-hover:text-gray-400 transition-colors">
      {stat.label}
    </span>
  </div>
);

const SettingsLink = ({
  item,
  showInput,
}: {
  item: (typeof SETTINGS_LINKS)[0];
  showInput?: boolean;
}) => (
  <div className="w-full">
    <div className="w-full bg-[#1518215f] border border-white/5 rounded-xl hover:bg-[#15182180] hover:border-white/20 transition-all group text-left shadow-sm p-4 flex flex-col min-h-[80px] justify-center">
      <div className="flex items-start gap-4 w-full">
        <div className="p-2.5 rounded-lg text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all flex-shrink-0">
          <item.icon size={18} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
            {item.label}
          </h4>
          <p className="text-xs text-gray-500">{item.desc}</p>
          {showInput && (
            <input
              type="text"
              placeholder="Enter Gemini API Key"
              className="w-full rounded-lg bg-transparent border border-white/5 text-white px-3 py-2 mt-4 focus:outline-none transition-colors text-sm"
            />
          )}
        </div>
      </div>
    </div>
  </div>
);

const ContinueWatchingCard = ({
  item,
}: {
  item: (typeof CONTINUE_WATCHING)[0];
}) => (
  <div className="group relative flex items-center gap-5 p-4 bg-[#1518215f] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-[#15182180] transition-all cursor-pointer overflow-hidden shadow-lg hover:shadow-xl hover:shadow-black/20">
    <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-[#0f1115] flex-shrink-0 shadow-inner">
      <Image
        src={item.image}
        alt={item.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
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
        {item.year && <span className="text-gray-600">• {item.year}</span>}
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
  </div>
);

const WatchlistCard = () => (
  <div className="group relative aspect-[2/3] bg-[#1518215f] border border-white/5 rounded-xl hover:border-white/10 hover:bg-[#15182170] overflow-hidden cursor-pointer shadow-md transition-all duration-300">
    <div className="absolute inset-0 ">
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

const ProfileSkeleton = () => (
  <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-8 w-full pt-32 pb-16 px-8 md:px-16 lg:px-20">
    <div className="lg:col-span-4 space-y-6">
      <div className="h-[400px] bg-[#1518215f] border border-white/5 rounded-3xl" />
      <div className="h-40 rounded-3xl bg-[#151821] border border-white/5" />
    </div>
    <div className="lg:col-span-8 space-y-8">
      <div className="h-10 w-1/3 bg-white/10 rounded-lg mb-4" />
      <div className="h-32 bg-[#1518215f] border border-white/5 rounded-2xl" />
      <div className="h-32 bg-[#1518215f] border border-white/5 rounded-2xl" />
      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="aspect-[2/3] rounded-xl bg-[#1518215f]" />
        <div className="aspect-[2/3] rounded-xl bg-[#1518215f]" />
        <div className="aspect-[2/3] rounded-xl bg-[#1518215f]" />
        <div className="aspect-[2/3] rounded-xl bg-[#151821]" />
      </div>
    </div>
  </div>
);

export default function ProfilePage() {
  const { user, loading, firstName, avatarUrl } = useAuth();
  const router = useRouter();
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    setIsSignOutLoading(true);
    await supabase.auth.signOut();
    router.push("/landing");
  };

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="relative min-h-screen bg-black text-white font-sans pt-32 pb-16 px-8 md:px-16 lg:px-16">
      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#155f75b5] blur-[130px] opacity-40" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#9a341299] blur-[130px] opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000000_100%)]" />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT COLUMN: Identity & Navigation (4 cols) --- */}
          <div className="lg:col-span-4 flex flex-col justify-between lg:sticky lg:top-32 h-fit">
            {/* Identity Card */}
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
                  {STATS.map((stat) => (
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

            {/* Settings Nav Menu */}
            <div className="space-y-3 mt-6 mb-2">
              <h3 className="px-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                Preferences
              </h3>
              {SETTINGS_LINKS.map((link) =>
                link.label === "Gemini API Key" ? (
                  <SettingsLink key={link.label} item={link} showInput />
                ) : (
                  <SettingsLink key={link.label} item={link} />
                )
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN: Content Feed (8 cols) --- */}
          <div className="lg:col-span-8 space-y-10">
            {/* Header Section */}
            <div className="flex flex-col items-start gap-1">
              <h1
                className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
              >
                Dashboard
              </h1>
              <p className="text-gray-400">Welcome back to your collection.</p>
            </div>

            {/* Continue Watching Section */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="text-xl font-bold text-white flex items-center gap-3"
                  style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                >
                  Continue Watching
                </h3>
              </div>
              <div className="flex flex-col gap-4">
                {CONTINUE_WATCHING.map((item) => (
                  <ContinueWatchingCard key={item.id} item={item} />
                ))}
              </div>
            </section>

            {/* Watchlist Preview Section */}
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
                {Array.from({ length: 4 }).map((_, i) => (
                  <WatchlistCard key={i} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
