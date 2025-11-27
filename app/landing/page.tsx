"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../globals.css";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeft,
  ChevronRight,
  LogOut,
  Home,
  Shield,
  Clock,
  Info,
} from "lucide-react";

export default function LandingPage() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-linear-to-b from-black/80 to-transparent">
        <div className="md:mx-40 px-4 py-4 flex items-center justify-between">
          {/* Mobile Menu Button */}

          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Riyura Logo"
              width={35}
              height={35}
              className="md:hidden object-contain"
            />
            <Image
              src="/logo.png"
              alt="Riyura Logo"
              width={60}
              height={60}
              className="hidden md:block object-contain"
            />
            <span
              className="text-xl md:text-2xl font-bold tracking-wider"
              style={{ fontFamily: "'Bruno Ace', sans-serif" }}
            >
              RIYURA
            </span>
          </div>

          <div className="hidden md:flex items-center justify-between gap-16 text-sm uppercase tracking-wider text-gray-300">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              F E A T U R E S
            </button>
            <button
              onClick={() => scrollToSection("security")}
              className="hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              S E C U R I T Y
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              A B O U T
            </button>
            <button
              onClick={() => scrollToSection("history")}
              className="hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              H I S T O R Y
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile Box - Desktop */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg border border-white/10 cursor-pointer hover:border-white/20 transition-all">
              <span className="text-sm uppercase tracking-wider text-gray-300">
                U S E R
              </span>
              <div className="w-8 h-8 rounded overflow-hidden relative">
                <Image
                  src="/userPhoto.png"
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
                    e.currentTarget.parentElement!.innerHTML = "U";
                  }}
                />
              </div>
            </div>

            {/* Profile Box - Mobile */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="md:hidden flex items-center backdrop-blur-md gap-1 pl-2 pr-1 py-1 rounded-lg border border-white/10 border-gradient cursor-pointer hover:border-white/20 transition-all"
            >
              <span className="text-xs uppercase tracking-wider text-gray-300">
                USER
              </span>
              <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center relative">
                <Image
                  src="/userPhoto.png"
                  alt="Profile"
                  width={32}
                  height={32}
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement!.classList.add(
                      "bg-gradient-to-br",
                      "from-blue-500",
                      "to-cyan-500",
                      "flex",
                      "items-center",
                      "justify-center"
                    );
                    e.currentTarget.parentElement!.innerHTML = "U";
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative isolate min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image - Desktop */}
        <div className="hidden md:block absolute inset-0 z-0">
          <Image
            src="/landingPage.png"
            alt="Landing Page Background"
            fill
            priority
            className="object-cover object-center"
            style={{ filter: "brightness(0.6) contrast(1.1)" }}
          />
        </div>

        {/* Background Image - Mobile */}
        <div className="block md:hidden absolute inset-0 z-0">
          <Image
            src="/mobileLandingPage.jpg"
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
            className="blend text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-3"
            style={{
              fontFamily: "'Bruno Ace', sans-serif",
            }}
          >
            Beyond Limits.
          </h1>

          <h1
            className="blend text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white"
            style={{
              fontFamily: "'Bruno Ace', sans-serif",
              mixBlendMode: "overlay",
            }}
          >
            Beyond Definition.
          </h1>
        </div>

        {/* Hero Content (buttons and paragraph at the bottom) */}
        <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end z-20 pb-12 md:pb-16">
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
              className="group relative flex flex-row rounded-full items-center justify-center gap-2 md:gap-3 overflow-hidden h-10 md:h-16 px-4 md:px-12 text-sm md:text-lg font-bold tracking-wider uppercase transition-all duration-300"
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
