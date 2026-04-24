import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ReportEditForm from "@/components/forms/ReportEditForm";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ReportEditData {
  id: string;
  description: string;
  work_start: string;
  work_end: string;
  status: string;
  user_id: string;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Laporan #${id.slice(0, 8).toUpperCase()} — Manage Service`,
    description: "Form edit laporan kerja",
  };
}

async function getReport(id: string, cookieHeader: string): Promise<ReportEditData | null> {
  const url = new URL(`/api/reports/${id}`, process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  const res = await fetch(url.toString(), {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default async function EditReportPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const report = await getReport(id, cookieHeader);

  if (!report) notFound();

  // Ownership enforced — only the report owner can edit
  if (report.user_id !== session.user.id) {
    redirect("/dashboard");
  }

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
            work_start: report.work_start,
            work_end: report.work_end,
          }}
        />
      </div>
    </div>
  );
}
