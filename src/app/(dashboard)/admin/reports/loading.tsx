// Loading skeleton for admin reports page
export default function AdminReportsLoading() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.75rem", gap: "1rem" }}>
        <div>
          <div className="skeleton" style={{ width: "180px", height: "2rem", marginBottom: "0.5rem" }} />
          <div className="skeleton" style={{ width: "220px", height: "1rem" }} />
        </div>
        <div className="skeleton" style={{ width: "130px", height: "2.5rem" }} />
      </div>

      {/* Filter skeleton */}
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}>
        <div className="skeleton" style={{ width: "140px", height: "1rem", marginBottom: "0.875rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div className="skeleton" style={{ width: "60px", height: "0.875rem" }} />
              <div className="skeleton" style={{ width: "100%", height: "2.5rem" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr 1fr 1fr",
                gap: "1rem",
                padding: "0.875rem 0",
                borderBottom: i < 6 ? "var(--border)" : "none",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <div key={j} className="skeleton" style={{ height: "1.25rem" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
