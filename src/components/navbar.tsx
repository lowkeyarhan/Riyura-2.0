"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";

export default function Navbar() {
  const router = useRouter();
  const { user, loading, firstName, avatarUrl } = useAuth();

  const handleProfileClick = () => {
    if (user) {
      router.push("/profile");
    } else {
      router.push("/auth");
    }
  };

  return (
    <nav className="absolute top-0 w-full z-50 bg-linear-to-b from-black/80 to-transparent">
      <div className="px-8 md:px-16 lg:px-20 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0 cursor-pointer">
          <img src="/logo.png" alt="Riyura Logo" className="h-8 w-8" />
          <span
            className="text-white font-bold text-xl"
            style={{ fontFamily: "'Bruno Ace', sans-serif" }}
          >
            RIYURA
          </span>
        </div>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center justify-center gap-12 text-sm uppercase tracking-wider text-gray-300 flex-1">
          <button
            onClick={() => router.push("/home")}
            className="hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            H O M E
          </button>
          <button
            onClick={() => router.push("/watchlist")}
            className="hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            W A T C H L I S T
          </button>
          <button
            onClick={() => router.push("/search")}
            className="hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            S E A R C H
          </button>
          <button
            onClick={() => router.push("/explore")}
            className="hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            E X P L O R E
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Auth / Profile Box */}
          <div
            onClick={handleProfileClick}
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
                <div className="w-8 h-8 rounded overflow-hidden bg-gray-700 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${firstName || "User"} avatar`}
                      className="w-full h-full object-cover"
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
          </div>
        </div>
      </div>
    </nav>
  );
}
