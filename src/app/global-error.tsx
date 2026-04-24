"use client";

// Root error boundary — catches unexpected errors in root layout children
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif", background: "#FFFDF0" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "#FF3B3B",
              border: "3px solid #000",
              boxShadow: "8px 8px 0px #000",
              padding: "2rem 3rem",
              maxWidth: "480px",
              width: "100%",
              color: "#fff",
            }}
          >
            <p style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⚠️</p>
            <h1
              style={{
                fontWeight: 800,
                fontSize: "1.5rem",
                marginBottom: "0.75rem",
              }}
            >
              Terjadi Kesalahan
            </h1>
            <p style={{ marginBottom: "1.5rem", fontSize: "0.9375rem", opacity: 0.9 }}>
              Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator.
            </p>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "1rem" }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                background: "#fff",
                color: "#000",
                border: "2px solid #000",
                padding: "0.625rem 1.25rem",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
