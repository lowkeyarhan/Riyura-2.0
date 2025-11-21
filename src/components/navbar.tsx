"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { path: "/home", label: "H O M E" },
  { path: "/watchlist", label: "W A T C H L I S T" },
  { path: "/search", label: "S E A R C H" },
  { path: "/explore", label: "E X P L O R E" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, firstName, avatarUrl } = useAuth();

  const handleProfileClick = () => {
    if (user) {
      router.push("/profile");
    } else {
      router.push("/auth");
    }
  };

  return (
    // Kept original background and positioning
    <nav className="absolute top-0 w-full z-50 bg-linear-to-b from-black/80 to-transparent">
      <div className="px-8 md:px-16 lg:px-16 py-4 flex items-center justify-between">
        {/* LOGO */}
        <Link
          href="/home"
          prefetch={true}
          className="group flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0 cursor-pointer"
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <Image src="/logo.png" alt="Riyura Logo" width={32} height={32} />
          </motion.div>
          <span
            className="text-white font-bold text-xl"
            style={{ fontFamily: "'Bruno Ace', sans-serif" }}
          >
            RIYURA
          </span>
        </Link>

        {/* ANIMATED NAV LINKS */}
        <div className="hidden md:flex items-center justify-center gap-12 text-sm uppercase tracking-wider flex-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.path;

            return (
              <Link
                key={link.path}
                href={link.path}
                prefetch={true}
                className="relative py-1 cursor-pointer"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <span
                  className={`transition-colors duration-300 ${
                    isActive ? "text-white" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {link.label}
                </span>

                {/* THE SLIDING ANIMATION */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* AUTH / PROFILE BOX */}
        <div className="flex items-center gap-3">
          <motion.div
            onClick={handleProfileClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center backdrop-blur-md gap-3 pl-4 pr-2 py-2 rounded-lg border border-white/10 border-gradient cursor-pointer hover:border-white/20 transition-all"
          >
            {loading ? (
              <span className="text-sm uppercase tracking-wider text-gray-400 animate-pulse">
                L O A D I N G
              </span>
            ) : user ? (
              <>
                <span className="text-sm uppercase tracking-wider text-gray-300">
                  {firstName?.toUpperCase() || "U S E R"}
                </span>
                <div className="w-8 h-8 rounded overflow-hidden bg-gray-700 flex items-center justify-center relative">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={`${firstName || "User"} avatar`}
                      width={32}
                      height={32}
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.classList.add(
                          "bg-gradient-to-br",
                          "from-blue-500",
                          "to-cyan-500"
                        );
                        e.currentTarget.parentElement!.innerHTML = `<span class='text-xs font-bold'>${(firstName ||
                          "?")[0].toUpperCase()}</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-xs font-bold">
                      {(firstName || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-sm uppercase tracking-wider text-gray-300">
                S I G N&nbsp;I N
              </span>
            )}
          </motion.div>
        </div>
      </div>
    </nav>
  );
}
