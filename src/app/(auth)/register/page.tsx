import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Daftar — Manage Service",
  description: "Buat akun baru untuk mengakses sistem laporan kerja karyawan.",
};

interface RoleOption {
  id: string;
  name: string;
  label: string;
}

// Fetch active non-ADMIN roles for the dropdown directly from DB
async function getAvailableRoles(): Promise<RoleOption[]> {
  try {
    return await prisma.role.findMany({
      where: {
        is_active: true,
        name: { not: "ADMIN" },
      },
      select: { id: true, name: true, label: true },
      orderBy: { label: "asc" },
    });
  } catch (error) {
    console.error("[RegisterPage] gagal mengambil role:", error);
    return [];
  }
}

export default async function RegisterPage() {
  const roles = await getAvailableRoles();

  return (
    <div className="auth-wrapper">
      <div style={{ width: "100%", maxWidth: "460px" }}>
        {/* Brand header */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              background: "var(--color-primary)",
              border: "3px solid #000",
              boxShadow: "4px 4px 0 #000",
              marginBottom: "1rem",
              fontSize: "1.5rem",
            }}
          >
            📋
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            Manage Service
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              color: "var(--color-muted)",
              fontWeight: 500,
            }}
          >
            Laporan Karyawan Internal
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ boxShadow: "6px 6px 0 #000" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "1.25rem",
              marginBottom: "1.5rem",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid #000",
            }}
          >
            Buat Akun Baru
          </h2>

          <RegisterForm roles={roles} />
        </div>
      </div>
    </div>
  );
}
