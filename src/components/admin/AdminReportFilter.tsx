"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface AdminReportFilterProps {
  roles: FilterOption[];
  currentRole: string;
  currentStatus: string;
  currentSearch: string;
  currentDateFrom: string;
  currentDateTo: string;
}

export function AdminReportFilter({
  roles,
  currentRole,
  currentStatus,
  currentSearch,
  currentDateFrom,
  currentDateTo,
}: AdminReportFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const applyFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset to page 1 on filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const resetAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    currentRole || currentStatus || currentSearch || currentDateFrom || currentDateTo;

  return (
    <div className="card" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.875rem",
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: "0.8125rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          🔍 Filter Laporan
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={resetAll}
            id="btn-reset-filter"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.875rem",
        }}
      >
        {/* Search */}
        <div className="form-group">
          <span className="label">Cari</span>
          <input
            id="filter-search"
            className="input"
            type="text"
            placeholder="Nama / deskripsi..."
            defaultValue={currentSearch}
            onChange={(e) => {
              const val = e.target.value;
              const timer = setTimeout(() => applyFilter("search", val), 400);
              return () => clearTimeout(timer);
            }}
          />
        </div>

        {/* Role filter */}
        <div className="form-group">
          <span className="label">Role</span>
          <select
            id="filter-role"
            className="input"
            value={currentRole}
            onChange={(e) => applyFilter("role", e.target.value)}
          >
            <option value="">Semua Role</option>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="form-group">
          <span className="label">Status</span>
          <select
            id="filter-status"
            className="input"
            value={currentStatus}
            onChange={(e) => applyFilter("status", e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        {/* Date from */}
        <div className="form-group">
          <span className="label">Dari Tanggal</span>
          <input
            id="filter-date-from"
            className="input"
            type="date"
            defaultValue={currentDateFrom}
            onChange={(e) => applyFilter("date_from", e.target.value)}
          />
        </div>

        {/* Date to */}
        <div className="form-group">
          <span className="label">Sampai Tanggal</span>
          <input
            id="filter-date-to"
            className="input"
            type="date"
            defaultValue={currentDateTo}
            onChange={(e) => applyFilter("date_to", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
