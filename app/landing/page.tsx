"use client";

import Link from "next/link";
import "../globals.css";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-linear-to-b from-black/80 to-transparent">
        <div className="mx-40 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Riyura Logo"
              width={60}
              height={60}
              className="object-contain"
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
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-white/10 cursor-pointer hover:border-white/20 transition-all">
              <span className="text-sm uppercase tracking-wider text-gray-300">
                U S E R
              </span>
              <div className="w-8 h-8 rounded overflow-hidden relative">
                <Image
                  src="/logo.png"
                  alt="Profile"
                  width={32}
                  height={32}
                  className="object-cover"
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
      <section className="relative isolate min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/landingPage.png"
              alt="Landing Page Background"
              fill
              priority
              className="object-cover object-center"
              style={{ filter: "brightness(0.6) contrast(1.1)" }}
            />
          </div>

        {/* Hero Headings */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none -translate-y-30">
          <h1
            className="blend text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-3"
            style={{
              fontFamily: "'Bruno Ace', sans-serif",
            }}
          >
            Beyond Limits.
          </h1>

          <h1
            className="blend text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white"
            style={{
              fontFamily: "'Bruno Ace', sans-serif",
              mixBlendMode: "overlay",
            }}
          >
            Beyond Definition.
          </h1>
        </div>

        {/* Hero Content (buttons and paragraph at the bottom) */}
        <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end z-20 pb-16">
          <div className="w-full text-center px-6 z-10 mb-12">
            <p
              className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-extralight"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Dive into a world of unlimited movies, anime and shows with
              Riyura. Watch anything for free at stunning 4k HDR quality
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/auth"
              className="group relative flex flex-row rounded-full items-center justify-center gap-3 w-auto overflow-hidden h-16 px-12 text-lg font-bold tracking-wider uppercase transition-all duration-300"
              style={{ fontFamily: "'Bruno Ace', sans-serif" }}
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-linear-to-r from-orange-600 via-red-600 to-orange-600 opacity-100 group-hover:opacity-90 transition-opacity"></div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-linear-to-r from-orange-500 to-red-500 blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              {/* Content */}
              <svg
                className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="relative z-10 text-white">Start Watching</span>

              {/* Hover shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/20 to-transparent"></div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
