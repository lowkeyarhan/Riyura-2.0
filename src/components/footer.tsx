"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Twitter, Instagram, Youtube, ArrowRight, Send } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribed:", email);
    setEmail("");
  };

  return (
    <footer className="relative w-full bg-[#050505] pt-10 pb-6 overflow-hidden font-sans border-t border-white/5">
      {/* --- ATMOSPHERE (Subtler) --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[40vw] h-[300px] bg-gradient-to-t from-red-900/10 via-orange-900/5 to-transparent blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20">
        {/* --- MAIN CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-10">
          {/* Newsletter (Compact) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <h3
              className="text-xl md:text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              Stay in the loop.
            </h3>
            <p className="text-gray-500 text-xs mb-6 max-w-sm leading-relaxed">
              Get the latest trailers, exclusive reviews, and watchlist
              recommendations.
            </p>

            <form onSubmit={handleSubmit} className="relative max-w-sm group">
              <div className="relative flex items-center bg-[#151821] border border-white/10 rounded-lg p-1 pr-1.5 focus-within:border-white/20 transition-colors">
                <div className="pl-3 pr-2 text-gray-600">
                  <Send size={14} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent text-xs text-white placeholder-white/20 focus:outline-none py-2"
                  required
                />
                <button
                  type="submit"
                  className="p-2 rounded-md bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md hover:scale-105 transition-transform active:scale-95"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* Links Grid (Compact) */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                Discover
              </h4>
              <ul className="space-y-1.5">
                <FooterLink href="/movies">Movies</FooterLink>
                <FooterLink href="/tv">TV Series</FooterLink>
                <FooterLink href="/anime">Anime</FooterLink>
                <FooterLink href="/trending">Trending</FooterLink>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                Account
              </h4>
              <ul className="space-y-1.5">
                <FooterLink href="/profile">Profile</FooterLink>
                <FooterLink href="/watchlist">Watchlist</FooterLink>
                <FooterLink href="/history">History</FooterLink>
                <FooterLink href="/premium">Premium</FooterLink>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                Support
              </h4>
              <ul className="space-y-1.5">
                <FooterLink href="/help">Help Center</FooterLink>
                <FooterLink href="/terms">Terms</FooterLink>
                <FooterLink href="/privacy">Privacy</FooterLink>
                <FooterLink href="/contact">Contact</FooterLink>
              </ul>
            </div>
          </div>
        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Copyright */}
          <div className="flex items-center gap-4 order-2 md:order-1">
            <div className="flex items-center gap-2 opacity-80">
              <span
                className="text-sm font-bold text-white tracking-wider"
                style={{ fontFamily: "'Bruno Ace', sans-serif" }}
              >
                RIYURA
              </span>
            </div>
            <span className="text-gray-700 text-xs">|</span>
            <p className="text-[10px] text-gray-500">
              © 2025. Built by{" "}
              <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                Arhan Das
              </span>
              .
            </p>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-3 order-1 md:order-2">
            <SocialLink icon={Twitter} href="#" />
            <SocialLink icon={Instagram} href="#" />
            <SocialLink icon={Youtube} href="#" />
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Helper Components ---

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <li>
    <Link
      href={href}
      className="text-xs text-gray-400 hover:text-white transition-colors hover:translate-x-0.5 inline-block duration-200"
    >
      {children}
    </Link>
  </li>
);

const SocialLink = ({ icon: Icon, href }: { icon: any; href: string }) => (
  <a
    href={href}
    className="p-2 rounded-full bg-[#151821] border border-white/5 text-gray-400 hover:bg-white hover:text-black hover:border-white transition-all duration-300"
  >
    <Icon size={14} />
  </a>
);
