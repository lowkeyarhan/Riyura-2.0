"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Home,
  Bookmark,
  Search,
  Compass,
  LogOut,
  PanelLeft,
  ChevronRight,
  User,
} from "lucide-react";

const NAV_LINKS = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/watchlist", label: "Watchlist", icon: Bookmark },
  { path: "/search", label: "Search", icon: Search },
  { path: "/explore", label: "Explore", icon: Compass },
];

export default function MobileNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, firstName, avatarUrl, signOut } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleProfileClick = () => {
    if (user) {
      router.push("/profile");
      setIsOpen(false);
    } else {
      router.push("/auth");
      setIsOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
    setIsOpen(false);
  };

  return (
    <>
      {/* --- TOP BAR --- */}
      <nav className="absolute top-0 w-full z-50 px-4 py-4 flex items-center justify-between bg-gradient-to-b from-black to-transparent pointer-events-none">
        {/* Expand Button (Left) */}
        <button
          onClick={toggleMenu}
          className="pointer-events-auto p-2 text-white/80 hover:text-white transition-colors"
        >
          <PanelLeft className="w-6 h-6" />
        </button>

        {/* Profile Info (Right) */}
        <motion.div
          onClick={handleProfileClick}
          whileTap={{ scale: 0.95 }}
          className="pointer-events-auto flex items-center backdrop-blur-md gap-1 pl-2 pr-1 py-1 rounded-lg border border-white/10 border-gradient cursor-pointer hover:border-white/20 transition-all"
        >
          <span className="text-xs uppercase tracking-wider text-gray-300">
            {firstName?.toUpperCase() || "USER"}
          </span>
          <div className="w-8 h-8 rounded overflow-hidden bg-gray-700 flex items-center justify-center relative">
            {user && avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs">
                {firstName ? firstName[0].toUpperCase() : "U"}
              </div>
            )}
          </div>
        </motion.div>
      </nav>

      {/* --- SIDE DRAWER OVERLAY --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-black/80 z-[60]"
            />

            {/* Sliding Drawer (From Left) */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 left-0 h-full w-[60%] bg-[#1518215f] backdrop-blur-2xl z-[70] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="relative z-10 flex flex-col h-full">
                {/* Drawer Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Logo" width={24} height={24} />
                    <span
                      className="text-lg font-bold text-white tracking-wide"
                      style={{ fontFamily: "'Bruno Ace', sans-serif" }}
                    >
                      RIYURA
                    </span>
                  </div>
                  <button
                    onClick={toggleMenu}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        href={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`relative flex items-center gap-4 p-4 rounded-xl transition-all group ${
                          isActive
                            ? "bg-gradient-to-r from-orange-500/10 to-transparent text-white"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-orange-500" />
                        )}
                        <Icon
                          className={`w-5 h-5 ${
                            isActive
                              ? "text-orange-500"
                              : "text-gray-500 group-hover:text-white"
                          }`}
                        />
                        <span
                          className="font-medium tracking-wide text-sm"
                          style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
                        >
                          {link.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer (Profile/Auth Card) */}
                <div className="p-4 border-t border-white/5">
                  {user ? (
                    <div className="space-y-3">
                      <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1518215f] border border-white/5 hover:border-white/20 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden relative border border-white/10">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt="Profile"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#151821] text-white text-xs font-bold">
                              {firstName ? firstName[0].toUpperCase() : "U"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="block text-sm font-bold text-white">
                            {firstName || "User"}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                            View Profile
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-orange-600 rounded-xl  transition-colors text-xs font-bold uppercase tracking-widest"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        router.push("/auth");
                        setIsOpen(false);
                      }}
                      className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
                    >
                      Sign In / Register
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
