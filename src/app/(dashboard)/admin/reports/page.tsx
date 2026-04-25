import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { reportFilterSchema } from "@/lib/validations";
import { Pagination } from "@/components/ui/Pagination";
import { AdminReportFilter } from "@/components/admin/AdminReportFilter";
import { UpdateReportStatusModal } from "@/components/admin/UpdateReportStatusModal";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Laporan — Manage Service",
  description: "Pantau dan kelola semua laporan karyawan",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

interface ReportItem {
  id: string;
  status: string;
  description: string;
  work_start: string;
  work_end: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: { name: string; label: string };
  };
}

interface RoleOption {
  name: string;
  label: string;
}

interface PaginationMeta {
  halaman: number;
  batas: number;
  total: number;
  total_halaman: number;
}

async function getAdminReports(
  searchParams: URLSearchParams,
  cookieHeader: string,
): Promise<{ reports: ReportItem[]; meta: PaginationMeta }> {
  const url = new URL(
    "/api/admin/reports",
    process.env.INTERNAL_API_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  );
  searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok)
    return {
      reports: [],
      meta: { halaman: 1, batas: 20, total: 0, total_halaman: 0 },
    };
  const json = await res.json();
  return {
    reports: json.data ?? [],
    meta: json.meta ?? { halaman: 1, batas: 20, total: 0, total_halaman: 0 },
  };
}

async function getAdminRoles(cookieHeader: string): Promise<RoleOption[]> {
  const url = new URL(
    "/api/roles",
    process.env.INTERNAL_API_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  );
  const res = await fetch(url.toString(), {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS)) {
    redirect("/dashboard");
  }

  const raw = await searchParams;
  const filters = reportFilterSchema.parse(raw);

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const filterParams = new URLSearchParams();
  Object.entries(raw).forEach(([k, v]) => {
    if (v) filterParams.set(k, v);
  });

  const [{ reports, meta }, roles] = await Promise.all([
    getAdminReports(filterParams, cookieHeader),
    getAdminRoles(cookieHeader),
  ]);

  const total = meta.total;
  const totalPages = meta.total_halaman;

  // Build export PDF URL
  const exportParams = new URLSearchParams();
  if (filters.role) exportParams.set("role", filters.role);
  if (filters.status) exportParams.set("status", filters.status);
  if (filters.date_from) exportParams.set("date_from", filters.date_from);
  if (filters.date_to) exportParams.set("date_to", filters.date_to);
  if (filters.search) exportParams.set("search", filters.search);
  const exportUrl = `/api/admin/reports/export-pdf?${exportParams.toString()}`;

  const canExport = hasPermission(
    session.user.permissions,
    PERMISSIONS.EXPORT_PDF,
  );

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getDuration(start: string, end: string) {
    const diff = Math.floor(
      (new Date(end).getTime() - new Date(start).getTime()) / 60000,
    );
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}j ${m}m` : `${m}m`;
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1 className="section-title">Admin Laporan</h1>
          <p style={{ color: "var(--color-muted)", marginTop: "0.25rem" }}>
            Total{" "}
            <strong style={{ color: "var(--color-dark)" }}>{total}</strong>{" "}
            laporan
            {filters.status || filters.role || filters.search
              ? " (difilter)"
              : ""}
          </p>
        </div>
        {canExport && (
          <a
            href={exportUrl}
            className="btn btn-dark"
            id="btn-export-pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            📄 Export PDF
          </a>
        )}
      </div>

      {/* Filter */}
      <AdminReportFilter
        roles={roles.map((r) => ({ value: r.name, label: r.label }))}
        currentRole={filters.role ?? ""}
        currentStatus={filters.status ?? ""}
        currentSearch={filters.search ?? ""}
        currentDateFrom={filters.date_from ?? ""}
        currentDateTo={filters.date_to ?? ""}
      />

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {reports.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--color-muted)",
            }}
          >
            <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📋</p>
            <p style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
              Tidak ada laporan
            </p>
            <p style={{ marginTop: "0.25rem", fontSize: "0.9rem" }}>
              Coba ubah atau hapus filter yang aktif.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-neo">
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>Karyawan</th>
                  <th style={{ width: "12%" }}>Role</th>
                  <th style={{ width: "13%" }}>Tanggal</th>
                  <th style={{ width: "8%" }}>Durasi</th>
                  <th style={{ width: "27%" }}>Deskripsi</th>
                  <th style={{ width: "12%" }}>Status</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {report.user.name}
                      </span>
                      <br />
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-muted)",
                        }}
                      >
                        {report.user.email}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          background: "var(--color-primary)",
                          border: "2px solid #000",
                          padding: "0.1rem 0.4rem",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          display: "inline-block",
                        }}
                      >
                        {report.user.role.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {formatDate(report.work_start)}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontWeight: 700,
                        }}
                      >
                        {getDuration(report.work_start, report.work_end)}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {report.description}
                      </span>
                    </td>
                    <td>
                      <UpdateReportStatusModal
                        reportId={report.id}
                        currentStatus={report.status}
                        userName={report.user.name}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/reports/${report.id}`}
                        className="btn btn-secondary btn-sm"
                        id={`btn-admin-detail-${report.id}`}
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: "0 1.5rem", borderTop: "var(--border)" }}>
            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              totalItems={total}
              limit={filters.limit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
