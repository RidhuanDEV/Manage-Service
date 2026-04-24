"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export function Pagination({ currentPage, totalPages, totalItems, limit }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const goTo = (page: number) => router.push(createUrl(page));

  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalItems);

  // Build page range (show max 5 pages around current)
  const pages: (number | "...")[] = [];
  const delta = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (
      i === currentPage - delta - 1 ||
      i === currentPage + delta + 1
    ) {
      pages.push("...");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        padding: "1rem 0",
      }}
    >
      <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", fontWeight: 600 }}>
        Menampilkan <strong>{start}–{end}</strong> dari <strong>{totalItems}</strong> data
      </p>

      <div style={{ display: "flex", gap: "0.25rem" }}>
        <button
          id="pagination-prev"
          className="pagination-btn"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman sebelumnya"
        >
          ←
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="pagination-btn"
              style={{ cursor: "default", border: "none", background: "transparent" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              id={`pagination-page-${p}`}
              className={`pagination-btn ${p === currentPage ? "active" : ""}`}
              onClick={() => goTo(p as number)}
              aria-label={`Halaman ${p}`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          id="pagination-next"
          className="pagination-btn"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Halaman berikutnya"
        >
          →
        </button>
      </div>
    </div>
  );
}
