import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import Image from "next/image";
import DeleteReportButton from "@/components/forms/DeleteReportButton";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Laporan #${id.slice(0, 8).toUpperCase()} — Manage Service`,
    description: "Detail laporan kerja karyawan",
  };
}

export default async function ReportDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const report = await prisma.report.findFirst({
    where: { id, deleted_at: null },
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
  });

  if (!report) notFound();

  // Ownership check: user hanya bisa lihat laporan milik sendiri, admin bisa semua
  const isAdmin = hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS);
  if (!isAdmin && report.user_id !== session.user.id) {
    redirect("/dashboard");
  }

  const isOwner = report.user_id === session.user.id;
  const canEdit = isOwner && report.status === "pending";

  function formatDateTime(d: Date) {
    return d.toLocaleString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getDuration(start: Date, end: Date) {
    const diff = Math.floor((end.getTime() - start.getTime()) / 60000);
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
              {report.created_at.toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            {report.updated_at.getTime() !== report.created_at.getTime() && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", fontWeight: 600, marginTop: "0.125rem" }}>
                Diperbarui:{" "}
                {report.updated_at.toLocaleString("id-ID", {
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
              style={{
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              📷 Foto Sebelum Kerja
            </span>
            {/*
              unoptimized: src is a same-origin /api/files/... streaming route.
              Next.js Image Optimization cannot resize dynamic API responses.
            */}
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
              style={{
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              📸 Foto Sesudah Kerja
            </span>
            {/*
              unoptimized: src is a same-origin /api/files/... streaming route.
              Next.js Image Optimization cannot resize dynamic API responses.
            */}
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
