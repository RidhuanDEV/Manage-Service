import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Masuk — Manage Service",
  description: "Masuk ke akun Manage Service Anda untuk mengelola laporan kerja karyawan.",
};

export default function LoginPage() {
  return (
    <div className="auth-wrapper">
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Brand header */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "96px",
              height: "56px",
              background: "var(--color-primary)",
              border: "3px solid #000",
              boxShadow: "4px 4px 0 #000",
              marginBottom: "1rem",
              fontSize: "1.5rem",
            }}
          >
            <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            PKP
          </p>
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
          <p style={{ marginTop: "0.5rem", color: "var(--color-muted)", fontWeight: 500 }}>
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
            Masuk ke Akun
          </h2>

          <Suspense fallback={<div style={{ padding: "1rem", textAlign: "center" }}>Memuat formulir...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
