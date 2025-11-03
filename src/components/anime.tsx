"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Anime {
  id: number;
  name: string;
  poster_path: string;
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  overview: string;
  genre_ids?: number[];
  media_type?: string;
}

export default function Anime() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/trending-anime");
        if (!response.ok) {
          throw new Error("Failed to fetch anime");
        }
        const data = await response.json();
        setAnime(data.results || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setAnime([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, []);

  const filteredAnime = anime.filter((show) => {
    const name = show.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-dark">
      {/* Main Content */}
      <main className="mx-auto">
        {error && (
          <div className="flex justify-center items-center min-h-96">
            <div className="text-red-500 text-lg">Error: {error}</div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {filteredAnime.map((show) => (
                <div
                  key={show.id}
                  className="group relative cursor-pointer rounded-xl overflow-hidden transition-transform duration-300 hover:shadow-2xl hover:shadow-black/50"
                  onClick={() => {
                    // If it's a movie type anime, redirect to movie details page
                    if (show.media_type === "movie") {
                      router.push(`/details/movie/${show.id}`);
                    }
                    // Otherwise, it's a TV show - can add TV show details page later
                    // For now, you can either do nothing or redirect to movie page as well
                  }}
                >
                  <div className="relative aspect-2/3">
                    <Image
                      src={
                        show.poster_path
                          ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                          : "/placeholder.jpg"
                      }
                      alt={show.name || "Anime"}
                      fill
                      className="object-cover group-hover:brightness-50 transition-all duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                    {/* Radial gradient overlay effect */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
                        zIndex: 1,
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
                              {new Date(
                                show.first_air_date || show.release_date || ""
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        {show.vote_average && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <svg
                              className="w-4 h-4 fill-current"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            <span className="font-semibold">
                              {(show.vote_average / 2).toFixed(1)}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/95 via-black/70 to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-300`}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
