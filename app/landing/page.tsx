"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-linear-to-b from-black/80 to-transparent">
        <div className="mx-40 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Riyura Logo"
              className="w-15 h-15 object-contain"
            />
            <span
              className="text-2xl font-bold tracking-wider"
              style={{ fontFamily: "'Bruno Ace', sans-serif" }}
            >
              RIYURA
            </span>
          </div>

          <div className="hidden md:flex items-center justify-between gap-16 text-sm uppercase tracking-wider text-gray-300">
            <button
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              F E A T U R E S
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("security")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              S E C U R I T Y
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("about")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              A B O U T
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("history")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              H I S T O R Y
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile Box */}
            <div className="flex items-center gap-3 px-4 py-2 bg-[#1a2332] rounded-lg border border-white/10 cursor-pointer hover:border-white/20 transition-all">
              <span className="text-sm uppercase tracking-wider text-gray-300">
                KYLE
              </span>
              <div className="w-8 h-8 rounded overflow-hidden">
                <img
                  src="/profile-avatar.jpg"
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to gradient if image doesn't exist
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement!.classList.add(
                      "bg-gradient-to-br",
                      "from-blue-500",
                      "to-cyan-500",
                      "flex",
                      "items-center",
                      "justify-center"
                    );
                    e.currentTarget.parentElement!.innerHTML =
                      '<span class="text-xs font-bold">K</span>';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/landingPage.png')",
            }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Hero Content */}
        <div
          className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full"
          style={{ top: "0px", bottom: "0px" }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Link
              href="/home"
              className="group flex items-center gap-3 px-8 py-4 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full text-white font-semibold text-lg uppercase tracking-wider transition-all shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/70"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Start Watching
            </Link>

            <Link
              href="/explore"
              className="group flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold text-lg uppercase tracking-wider transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Browse Library
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
