import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { reportFilterSchema } from "@/lib/validations";
import { Pagination } from "@/components/ui/Pagination";
import { AdminReportFilter } from "@/components/admin/AdminReportFilter";
import { UpdateReportStatusModal } from "@/components/admin/UpdateReportStatusModal";
import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Admin Laporan — Manage Service",
  description: "Pantau dan kelola semua laporan karyawan",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS)) {
    redirect("/dashboard");
  }

  const raw = await searchParams;
  const filters = reportFilterSchema.parse(raw);

  // Build Prisma where clause
  const where: Prisma.ReportWhereInput = {
    deleted_at: null,
    ...(filters.status && { status: filters.status }),
    ...(filters.role && { user: { role: { name: filters.role } } }),
    ...(filters.search && {
      OR: [
        { description: { contains: filters.search } },
        { user: { name: { contains: filters.search } } },
      ],
    }),
    ...(filters.date_from || filters.date_to
      ? {
          work_start: {
            ...(filters.date_from && { gte: new Date(filters.date_from) }),
            ...(filters.date_to && {
              lte: new Date(filters.date_to + "T23:59:59"),
            }),
          },
        }
      : {}),
  };

  const [reports, total, roles] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: { select: { name: true, label: true } },
          },
        },
      },
    }),
    prisma.report.count({ where }),
    prisma.role.findMany({
      where: { is_active: true },
      select: { name: true, label: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / filters.limit);

  // Build export PDF URL
  const exportParams = new URLSearchParams();
  if (filters.role) exportParams.set("role", filters.role);
  if (filters.status) exportParams.set("status", filters.status);
  if (filters.date_from) exportParams.set("date_from", filters.date_from);
  if (filters.date_to) exportParams.set("date_to", filters.date_to);
  if (filters.search) exportParams.set("search", filters.search);
  const exportUrl = `/api/admin/reports/export-pdf?${exportParams.toString()}`;

  const canExport = hasPermission(session.user.permissions, PERMISSIONS.EXPORT_PDF);

  function formatDate(d: Date) {
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getDuration(start: Date, end: Date) {
    const diff = Math.floor((end.getTime() - start.getTime()) / 60000);
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
            <strong style={{ color: "var(--color-dark)" }}>{total}</strong> laporan
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
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-muted)" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📋</p>
            <p style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Tidak ada laporan</p>
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
                      <span style={{ fontWeight: 700 }}>{report.user.name}</span>
                      <br />
                      <span style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
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
