"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoadingDots from "./LoadingDots";

interface Anime {
  id: number;
  name: string;
  poster_path: string;
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  overview: string;
  media_type?: string;
}

interface AnimeProps {
  currentPage: number;
  itemsPerPage: number;
  onTotalItemsChange: (total: number) => void;
}

const CACHE_KEY = "homepage:trending-anime";
const CACHE_DURATION = 15 * 60 * 1000;
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getRating = (vote: number) => (vote / 2).toFixed(1);

const getImageUrl = (posterPath: string) =>
  posterPath ? `${IMAGE_BASE_URL}${posterPath}` : "/placeholder.jpg";

export default function Anime({
  currentPage,
  itemsPerPage,
  onTotalItemsChange,
}: AnimeProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true);
        const cached = localStorage.getItem(CACHE_KEY);

        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setAnime(data.results || []);
            setLoading(false);
            return;
          }
        }

        const response = await fetch("/api/trending-anime");
        if (!response.ok) throw new Error("Failed to fetch anime");

        const data = await response.json();
        setAnime(data.results || []);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setAnime([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, []);

  const filteredAnime = anime.filter((show) =>
    (show.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    onTotalItemsChange(filteredAnime.length);
  }, [filteredAnime.length, onTotalItemsChange]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAnime = filteredAnime.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {paginatedAnime.map((show) => (
          <div
            key={show.id}
            className="group relative cursor-pointer rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-black/50 transition-shadow"
            onClick={() => {
              const path = show.media_type === "movie" ? "movie" : "tvshow";
              router.push(`/details/${path}/${show.id}`);
            }}
          >
            <div className="relative aspect-2/3">
              <Image
                src={getImageUrl(show.poster_path)}
                alt={show.name || "Anime"}
                fill
                className="object-cover group-hover:brightness-50 transition-all duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
                }}
              />
            </div>

            <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white leading-tight">
                  {show.name}
                </h3>

                <div className="flex items-center gap-3 text-sm">
                  {(show.first_air_date || show.release_date) && (
                    <div className="flex items-center gap-1 text-gray-300">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>
                        {formatDate(
                          show.first_air_date || show.release_date || ""
                        )}
                      </span>
                    </div>
                  )}
                  {show.vote_average && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <span className="font-semibold">
                        {getRating(show.vote_average)}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
