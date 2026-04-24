"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

// Reusable scoped error boundary for all (dashboard) pages
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "440px",
          width: "100%",
          borderColor: "var(--color-danger)",
          boxShadow: "4px 4px 0px var(--color-danger)",
        }}
      >
        <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</p>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "1.25rem",
            marginBottom: "0.5rem",
          }}
        >
          Terjadi Kesalahan
        </h2>
        <p
          style={{
            color: "var(--color-muted)",
            marginBottom: "1.5rem",
            fontSize: "0.9375rem",
          }}
        >
          Gagal memuat halaman. Silakan coba lagi atau kembali ke dashboard.
        </p>
        {error.digest && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-muted)",
              marginBottom: "1rem",
              fontFamily: "monospace",
            }}
          >
            ID: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <Button
            variant="secondary"
            onClick={() => router.push("/dashboard")}
            id="btn-error-dashboard"
          >
            Dashboard
          </Button>
          <Button variant="primary" onClick={reset} id="btn-error-retry">
            Coba Lagi
          </Button>
        </div>
      </div>
    </div>
  );
}
