"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribed:", email);
    setEmail("");
  };

  return (
    <footer className="relative bg-white/10 text-white/30 mx-8 md:mx-16 lg:mx-16 lg:mb-6 p-6 rounded-t-3xl border border-white/15 overflow-hidden">
      {/* Background Effects
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -left-32 top-16 w-[70vw] h-[70vh] bg-cyan-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute -right-24 bottom-0 w-[60vw] h-[70vh] bg-orange-800/10 rounded-full blur-[160px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_40%,rgba(0,0,0,0.55)_100%)]"></div>
      </div> */}
      <div className="relative z-10">
        {/* Newsletter Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-6 tracking-tight text-white/50">
            SUBSCRIBE FOR NEW RELEASES & UPDATES.
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER YOUR EMAIL..."
              className="flex-1 px-4 py-3 border-2 border-black/15 rounded-lg bg-white/60 text-sm font-medium placeholder:text-black/50 placeholder:text-xs placeholder:uppercase placeholder:tracking-wider focus:outline-none focus:border-black/80 focus:bg-white/80 transition-all"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white/50 rounded-lg text-xs font-bold tracking-wider cursor-pointer transition-all"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              SUBSCRIBE
            </button>
          </form>
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 ">
          {/* Movies Column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white tracking-widest mb-2">
              MOVIES
            </h3>
            <Link
              href="/movies/action"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              ACTION
            </Link>
            <Link
              href="/movies/comedy"
              className="text-sm text-white/50  font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              COMEDY
            </Link>
            <Link
              href="/movies/drama"
              className="text-sm text-white/50  font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              DRAMA
            </Link>
            <Link
              href="/movies/thriller"
              className="text-sm text-white/50  font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              THRILLER
            </Link>
          </div>

          {/* TV Shows Column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white tracking-widest mb-2">
              TV SHOWS
            </h3>
            <Link
              href="/tv/trending"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              TRENDING
            </Link>
            <Link
              href="/tv/originals"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              ORIGINALS
            </Link>
            <Link
              href="/tv/series"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              SERIES
            </Link>
            <Link
              href="/tv/documentaries"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              DOCUMENTARIES
            </Link>
          </div>

          {/* Explore Column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white tracking-widest mb-2">
              EXPLORE
            </h3>
            <Link
              href="/watchlist"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              MY WATCHLIST
            </Link>
            <Link
              href="/downloads"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              DOWNLOADS
            </Link>
            <Link
              href="/help"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              HELP CENTER →
            </Link>
            <Link
              href="/faq"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              FAQ
            </Link>
          </div>

          {/* Connect Column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white tracking-widest mb-2">
              CONNECT
            </h3>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              INSTAGRAM ↗
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              TWITTER ↗
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              YOUTUBE ↗
            </a>
            <Link
              href="/contact"
              className="text-sm text-white/50 font-medium hover:translate-x-0.5 transition-transform w-fit"
            >
              CONTACT
            </Link>
          </div>
        </div>

        {/* Movie Reels Illustration */}
        <div className="mb-6 overflow-hidden">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-32 text-white/100"
          >
            {/* Film Reel 1 */}
            <rect
              x="20"
              y="60"
              width="60"
              height="80"
              rx="4"
              fill="currentColor"
              opacity="0.3"
            />
            <circle
              cx="50"
              cy="50"
              r="25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />
            <circle
              cx="50"
              cy="50"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />

            {/* Film Strip */}
            <rect
              x="100"
              y="70"
              width="120"
              height="60"
              rx="4"
              fill="currentColor"
              opacity="0.3"
            />
            <line
              x1="110"
              y1="70"
              x2="110"
              y2="130"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1="210"
              y1="70"
              x2="210"
              y2="130"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Popcorn Box */}
            <path
              d="M 250 85 L 270 85 L 280 120 L 240 120 Z"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="242"
              y="120"
              width="36"
              height="15"
              fill="currentColor"
              opacity="0.3"
            />

            {/* Film Canister */}
            <rect
              x="310"
              y="75"
              width="35"
              height="55"
              rx="3"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="305"
              y="70"
              width="45"
              height="8"
              rx="4"
              fill="currentColor"
              opacity="0.4"
            />

            {/* Clapperboard */}
            <rect
              x="370"
              y="85"
              width="70"
              height="50"
              rx="3"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M 370 95 L 440 95 L 435 85 L 370 85 Z"
              fill="currentColor"
              opacity="0.5"
            />

            {/* Film Reel 2 */}
            <circle
              cx="480"
              cy="100"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />
            <circle
              cx="480"
              cy="100"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />

            {/* Ticket */}
            <rect
              x="530"
              y="80"
              width="50"
              height="45"
              rx="3"
              fill="currentColor"
              opacity="0.3"
            />
            <circle cx="535" cy="102" r="3" fill="currentColor" opacity="0.3" />
            <circle cx="575" cy="102" r="3" fill="currentColor" opacity="0.3" />

            {/* 3D Glasses */}
            <rect
              x="600"
              y="95"
              width="25"
              height="20"
              rx="2"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="630"
              y="95"
              width="25"
              height="20"
              rx="2"
              fill="currentColor"
              opacity="0.3"
            />
            <line
              x1="625"
              y1="105"
              x2="630"
              y2="105"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.4"
            />

            {/* Film Strip 2 */}
            <rect
              x="680"
              y="75"
              width="100"
              height="50"
              rx="4"
              fill="currentColor"
              opacity="0.3"
            />
            <line
              x1="690"
              y1="75"
              x2="690"
              y2="125"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1="770"
              y1="75"
              x2="770"
              y2="125"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Popcorn Bucket */}
            <path
              d="M 800 90 L 825 90 L 835 125 L 790 125 Z"
              fill="currentColor"
              opacity="0.3"
            />

            {/* Film Reel 3 */}
            <circle
              cx="870"
              cy="100"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />
            <circle
              cx="870"
              cy="100"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />

            {/* Camera */}
            <rect
              x="920"
              y="85"
              width="50"
              height="40"
              rx="4"
              fill="currentColor"
              opacity="0.3"
            />
            <circle
              cx="945"
              cy="105"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />
            <rect
              x="970"
              y="95"
              width="15"
              height="20"
              rx="2"
              fill="currentColor"
              opacity="0.4"
            />

            {/* Film Canister 2 */}
            <rect
              x="1010"
              y="78"
              width="32"
              height="52"
              rx="3"
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="1006"
              y="73"
              width="40"
              height="7"
              rx="3"
              fill="currentColor"
              opacity="0.4"
            />

            {/* Film Strip 3 */}
            <rect
              x="1070"
              y="80"
              width="90"
              height="45"
              rx="4"
              fill="currentColor"
              opacity="0.3"
            />
            <line
              x1="1078"
              y1="80"
              x2="1078"
              y2="125"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1="1152"
              y1="80"
              x2="1152"
              y2="125"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Copyright */}
        <p className="text-xs text-center text-white/60 font-medium tracking-wider">
          ©2025 RIYURA. Built by{" "}
          <a className="text-white/100 font-bold transition-colors">
            Arhan Das
          </a>
        </p>
      </div>
    </footer>
  );
}
