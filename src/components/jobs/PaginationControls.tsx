"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
}

export default function PaginationControls({
  currentPage,
  totalPages,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    // Clear selectedJobId when changing pages so TopMatchesList
    // defaults cleanly to the first job on the new page
    params.delete("selectedJobId");
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const maxPagesToShow = 3;

    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 2) {
      return [1, 2, 3];
    }

    if (currentPage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    }

    return [currentPage - 1, currentPage, currentPage + 1];
  };

  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div className="text-gray-500 text-xs">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center space-x-1">
        {/* First page button */}
        {currentPage > 2 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className="flex cursor-pointer items-center justify-center h-7 w-7 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="First page"
            >
              1
            </button>
            <span className="text-gray-400 text-xs px-0.5">…</span>
          </>
        )}

        {/* Previous button */}
        <button
          onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center justify-center h-7 w-7 rounded text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`flex cursor-pointer items-center justify-center h-7 w-7 rounded text-xs font-medium transition-colors ${
              currentPage === page
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center cursor-pointer justify-center h-7 w-7 rounded text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last page button */}
        {currentPage < totalPages - 1 && (
          <>
            <span className="text-gray-400 text-xs px-0.5">…</span>
            <button
              onClick={() => goToPage(totalPages)}
              className="flex cursor-pointer items-center justify-center h-7 w-7 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Last page"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
