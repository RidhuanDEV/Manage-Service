import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReportEditForm from "@/components/forms/ReportEditForm";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Laporan #${id.slice(0, 8).toUpperCase()} — Manage Service`,
    description: "Form edit laporan kerja",
  };
}

export default async function EditReportPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const report = await prisma.report.findFirst({
    where: {
      id,
      user_id: session.user.id, // ownership enforced at DB query level
      deleted_at: null,
    },
    select: {
      id: true,
      description: true,
      work_start: true,
      work_end: true,
      status: true,
    },
  });

  if (!report) notFound();

  // Only pending reports are editable
  if (report.status !== "pending") {
    redirect(`/reports/${id}`);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Link
            href={`/reports/${id}`}
            className="btn btn-secondary btn-sm"
            id="btn-kembali-detail"
          >
            ← Kembali
          </Link>
        </div>
        <h1 className="section-title">Edit Laporan</h1>
        <p style={{ color: "var(--color-muted)", marginTop: "0.25rem" }}>
          Hanya laporan dengan status{" "}
          <strong style={{ color: "var(--color-pending)" }}>Menunggu</strong> yang dapat
          diedit.
        </p>
      </div>

      {/* Warning notice */}
      <div
        className="card"
        style={{
          background: "rgba(255,184,0,0.1)",
          borderColor: "var(--color-pending)",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
          padding: "1rem 1.25rem",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>⚠️</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>Perhatian</p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
            Setelah laporan disetujui atau ditolak, laporan tidak dapat lagi diedit.
            Foto yang tidak diganti akan tetap menggunakan foto lama.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card">
        <ReportEditForm
          reportId={id}
          defaultValues={{
            description: report.description,
            work_start: report.work_start.toISOString(),
            work_end: report.work_end.toISOString(),
          }}
        />
      </div>
    </div>
  );
}
