import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import ReportForm from "@/components/forms/ReportForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Laporan — Manage Service",
  description: "Form pembuatan laporan kerja harian",
};

export default async function NewReportPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.permissions, PERMISSIONS.CREATE_REPORT)) {
    redirect("/dashboard");
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Link
            href="/dashboard"
            className="btn btn-secondary btn-sm"
            id="btn-kembali-dashboard"
          >
            ← Kembali
          </Link>
        </div>
        <h1 className="section-title">Buat Laporan Kerja</h1>
        <p style={{ color: "var(--color-muted)", marginTop: "0.25rem" }}>
          Isi form berikut dengan detail pekerjaan yang telah selesai dilakukan.
        </p>
      </div>

      {/* Form Card */}
      <div className="card">
        <ReportForm />
      </div>

      {/* Info box */}
      <div
        className="card"
        style={{
          marginTop: "1rem",
          background: "rgba(255,215,0,0.1)",
          borderColor: "var(--color-primary)",
        }}
      >
        <h3
          style={{
            fontWeight: 700,
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.5rem",
          }}
        >
          📌 Panduan Pengisian
        </h3>
        <ul
          style={{
            fontSize: "0.875rem",
            color: "var(--color-muted)",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            paddingLeft: "1.25rem",
          }}
        >
          <li>Waktu selesai harus lebih besar dari waktu mulai</li>
          <li>Deskripsi minimal 10 karakter</li>
          <li>Foto sebelum dan sesudah wajib diunggah</li>
          <li>Format gambar: JPG, PNG, atau WebP — maks. 5MB</li>
        </ul>
      </div>
    </div>
  );
}
