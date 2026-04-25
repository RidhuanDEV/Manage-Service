import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { paginationSchema } from "@/lib/validations";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Manage Service",
  description: "Lihat semua laporan kerja Anda",
};

interface ReportItem {
  id: string;
  description: string;
  work_start: string;
  work_end: string;
  status: string;
  created_at: string;
  reject_reason: string | null;
}

interface PaginationMeta {
  halaman: number;
  batas: number;
  total: number;
  total_halaman: number;
}

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

async function getReports(
  cookieHeader: string,
  page: number,
  limit: number,
): Promise<{ reports: ReportItem[]; meta: PaginationMeta }> {
  // Server component calling its own API — use absolute URL via process.env
  const url = new URL(
    "/api/reports",
    process.env.INTERNAL_API_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  );
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      // Forward all cookies for auth
      Cookie: cookieHeader,
    },
    // No caching — always fresh data
    cache: "no-store",
  });

  if (!res.ok)
    return {
      reports: [],
      meta: { halaman: page, batas: limit, total: 0, total_halaman: 0 },
    };

  const json = await res.json();
  return {
    reports: json.data ?? [],
    meta: json.meta ?? {
      halaman: page,
      batas: limit,
      total: 0,
      total_halaman: 0,
    },
  };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const { page, limit } = paginationSchema.parse(params);

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const { reports, meta } = await getReports(cookieHeader, page, limit);

  const total = meta.total;
  const totalPages = meta.total_halaman;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
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
          <h1 className="section-title">Dashboard</h1>
          <p style={{ color: "var(--color-muted)", marginTop: "0.25rem" }}>
            Selamat datang,{" "}
            <strong style={{ color: "var(--color-dark)" }}>
              {session.user.name}
            </strong>{" "}
            — {session.user.role?.label}
          </p>
        </div>
        <Link
          href="/reports/new"
          className="btn btn-primary"
          id="btn-buat-laporan"
        >
          + Buat Laporan
        </Link>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        {[
          { label: "Total Laporan", value: total, color: "var(--color-dark)" },
          {
            label: "Menunggu",
            value: reports.filter((r) => r.status === "pending").length,
            color: "var(--color-pending)",
          },
          {
            label: "Disetujui",
            value: reports.filter((r) => r.status === "approved").length,
            color: "var(--color-success)",
          },
          {
            label: "Ditolak",
            value: reports.filter((r) => r.status === "rejected").length,
            color: "var(--color-danger)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{ textAlign: "center", padding: "1.25rem" }}
          >
            <p
              style={{
                fontSize: "2rem",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                color: stat.color,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--color-muted)",
                marginTop: "0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "var(--border-thick)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            Laporan Saya
          </h2>
          <span
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-muted)",
              fontWeight: 600,
            }}
          >
            {total} laporan
          </span>
        </div>

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
              Belum ada laporan
            </p>
            <p style={{ marginTop: "0.25rem", fontSize: "0.9rem" }}>
              Mulai dengan membuat laporan pertama Anda.
            </p>
            <Link
              href="/reports/new"
              className="btn btn-primary"
              style={{ marginTop: "1rem", display: "inline-flex" }}
            >
              + Buat Laporan
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-neo">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Tanggal</th>
                  <th style={{ width: "35%" }}>Deskripsi</th>
                  <th style={{ width: "15%" }}>Durasi</th>
                  <th style={{ width: "15%" }}>Status</th>
                  <th style={{ width: "15%", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {formatDate(report.work_start)}
                      </span>
                      <br />
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-muted)",
                        }}
                      >
                        {formatTime(report.work_start)} –{" "}
                        {formatTime(report.work_end)}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          fontWeight: 500,
                        }}
                      >
                        {report.description}
                      </span>
                      {report.status === "rejected" && report.reject_reason && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-danger)",
                            marginTop: "0.25rem",
                            fontWeight: 600,
                          }}
                        >
                          Alasan: {report.reject_reason}
                        </p>
                      )}
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
                      <StatusBadge status={report.status} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Link
                          href={`/reports/${report.id}`}
                          className="btn btn-secondary btn-sm"
                          id={`btn-detail-${report.id}`}
                        >
                          Detail
                        </Link>
                        {report.status === "pending" && (
                          <Link
                            href={`/reports/${report.id}/edit`}
                            className="btn btn-dark btn-sm"
                            id={`btn-edit-${report.id}`}
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div
            style={{
              padding: "0 1.5rem",
              borderTop: "var(--border)",
            }}
          >
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              limit={limit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
