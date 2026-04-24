// Root not-found page — 404 for unmatched routes
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "var(--color-primary)",
          border: "3px solid #000",
          boxShadow: "8px 8px 0px #000",
          padding: "2rem 3rem",
          maxWidth: "480px",
          width: "100%",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "6rem",
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: "0.5rem",
          }}
        >
          404
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            fontWeight: 800,
            marginBottom: "0.75rem",
          }}
        >
          Halaman Tidak Ditemukan
        </h1>
        <p style={{ color: "#333", marginBottom: "1.5rem", fontSize: "0.9375rem" }}>
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <a
          href="/dashboard"
          className="btn btn-dark"
          id="btn-back-to-dashboard"
          style={{ display: "inline-flex" }}
        >
          ← Kembali ke Dashboard
        </a>
      </div>
    </div>
  );
}
