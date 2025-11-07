"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Don't show pagination if there are no items or only one page
  if (totalItems === 0 || totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-16 mb-12 py-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 ${
          currentPage === 1
            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
            : "bg-gray-800 text-white hover:bg-red-500 hover:scale-110"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {getPageNumbers().map((page, index) => (
        <div key={index}>
          {page === "..." ? (
            <span className="flex items-center justify-center w-12 h-12 text-gray-400 text-lg">
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 font-semibold text-lg ${
                currentPage === page
                  ? "bg-red-500 text-white scale-110"
                  : "bg-gray-800 text-white hover:bg-gray-700 hover:scale-105"
              }`}
              style={{ fontFamily: "Be Vietnam Pro, sans-serif" }}
            >
              {page}
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 ${
          currentPage === totalPages
            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
            : "bg-gray-800 text-white hover:bg-red-500 hover:scale-110"
        }`}
        aria-label="Next page"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
