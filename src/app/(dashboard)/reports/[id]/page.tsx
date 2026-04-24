import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import Image from "next/image";
import DeleteReportButton from "@/components/forms/DeleteReportButton";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ReportDetail {
  id: string;
  user_id: string;
  description: string;
  work_start: string;
  work_end: string;
  status: string;
  reject_reason: string | null;
  before_image_key: string;
  after_image_key: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: { name: string; label: string };
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Laporan #${id.slice(0, 8).toUpperCase()} — Manage Service`,
    description: "Detail laporan kerja karyawan",
  };
}

async function getReport(id: string, cookieHeader: string): Promise<ReportDetail | null> {
  const url = new URL(`/api/reports/${id}`, process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  const res = await fetch(url.toString(), {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  // We use the cookies() header to pass auth to our own API
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const report = await getReport(id, cookieHeader);

  if (!report) notFound();

  const isAdmin = hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS);
  if (!isAdmin && report.user_id !== session.user.id) {
    redirect("/dashboard");
  }

  const isOwner = report.user_id === session.user.id;
  const canEdit = isOwner && report.status === "pending";

  function formatDateTime(d: string) {
    return new Date(d).toLocaleString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getDuration(start: string, end: string) {
    const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Link
              href="/dashboard"
              className="btn btn-secondary btn-sm"
              id="btn-kembali-dashboard"
            >
              ← Kembali
            </Link>
          </div>
          <h1 className="section-title">Detail Laporan</h1>
          <p style={{ color: "var(--color-muted)", marginTop: "0.25rem" }}>
            ID: <code style={{ fontFamily: "monospace", fontWeight: 700 }}>{id}</code>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {canEdit && (
            <Link
              href={`/reports/${id}/edit`}
              className="btn btn-dark"
              id="btn-edit-laporan"
            >
              ✏️ Edit Laporan
            </Link>
          )}
          {isOwner && report.status === "pending" && (
            <DeleteReportButton reportId={id} />
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Info card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="label" style={{ margin: 0 }}>Status</span>
            <StatusBadge status={report.status} />
          </div>

          {report.status === "rejected" && report.reject_reason && (
            <div
              style={{
                background: "rgba(255,59,59,0.08)",
                border: "2px solid var(--color-danger)",
                padding: "0.875rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--color-danger)",
                  marginBottom: "0.25rem",
                }}
              >
                Alasan Penolakan
              </p>
              <p style={{ fontSize: "0.9375rem" }}>{report.reject_reason}</p>
            </div>
          )}

          {/* Karyawan */}
          <div>
            <span className="label">Karyawan</span>
            <p style={{ fontWeight: 700 }}>{report.user.name}</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
              {report.user.email}
            </p>
            <p style={{ fontSize: "0.875rem", marginTop: "0.125rem" }}>
              <span
                style={{
                  background: "var(--color-primary)",
                  border: "2px solid #000",
                  padding: "0.1rem 0.5rem",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                {report.user.role.label}
              </span>
            </p>
          </div>

          {/* Waktu Kerja */}
          <div>
            <span className="label">Waktu Mulai</span>
            <p style={{ fontWeight: 600 }}>{formatDateTime(report.work_start)}</p>
          </div>
          <div>
            <span className="label">Waktu Selesai</span>
            <p style={{ fontWeight: 600 }}>{formatDateTime(report.work_end)}</p>
          </div>
          <div>
            <span className="label">Durasi</span>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: "1.25rem",
              }}
            >
              {getDuration(report.work_start, report.work_end)}
            </p>
          </div>

          {/* Deskripsi */}
          <div>
            <span className="label">Deskripsi Pekerjaan</span>
            <p
              style={{
                lineHeight: 1.7,
                background: "#FFFDF0",
                border: "var(--border)",
                padding: "0.875rem",
                marginTop: "0.25rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {report.description}
            </p>
          </div>

          {/* Timestamps */}
          <div style={{ borderTop: "var(--border)", paddingTop: "0.875rem" }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", fontWeight: 600 }}>
              Dibuat:{" "}
              {new Date(report.created_at).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            {report.updated_at !== report.created_at && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", fontWeight: 600, marginTop: "0.125rem" }}>
                Diperbarui:{" "}
                {new Date(report.updated_at).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Images card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Before image */}
          <div className="card">
            <span
              className="label"
              style={{ display: "block", marginBottom: "0.75rem" }}
            >
              📷 Foto Sebelum Kerja
            </span>
            <Image
              src={`/api/files/${encodeURIComponent(report.before_image_key)}`}
              alt="Foto sebelum kerja"
              id="img-before"
              unoptimized
              width={0}
              height={0}
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "320px",
                objectFit: "contain",
                border: "var(--border-thick)",
                background: "#F5F5F5",
              }}
            />
          </div>

          {/* After image */}
          <div className="card">
            <span
              className="label"
              style={{ display: "block", marginBottom: "0.75rem" }}
            >
              📸 Foto Sesudah Kerja
            </span>
            <Image
              src={`/api/files/${encodeURIComponent(report.after_image_key)}`}
              alt="Foto sesudah kerja"
              id="img-after"
              unoptimized
              width={0}
              height={0}
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "320px",
                objectFit: "contain",
                border: "var(--border-thick)",
                background: "#F5F5F5",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
