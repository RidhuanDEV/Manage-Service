// Loading skeleton for report detail page
export default function ReportDetailLoading() {
  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <div className="skeleton" style={{ width: "80px", height: "2rem", marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ width: "180px", height: "2rem", marginBottom: "0.375rem" }} />
        <div className="skeleton" style={{ width: "240px", height: "1rem" }} />
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
          {[140, 100, 160, 120, 200].map((w, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div className="skeleton" style={{ width: "80px", height: "0.875rem" }} />
              <div className="skeleton" style={{ width: `${w}px`, height: "1.25rem" }} />
            </div>
          ))}
        </div>

        {/* Images */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div className="skeleton" style={{ width: "140px", height: "0.875rem", marginBottom: "0.75rem" }} />
            <div className="skeleton" style={{ width: "100%", height: "280px" }} />
          </div>
          <div className="card">
            <div className="skeleton" style={{ width: "140px", height: "0.875rem", marginBottom: "0.75rem" }} />
            <div className="skeleton" style={{ width: "100%", height: "280px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
