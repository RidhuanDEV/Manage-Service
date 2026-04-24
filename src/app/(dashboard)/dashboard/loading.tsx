// Dashboard loading skeleton
export default function DashboardLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.75rem",
          gap: "1rem",
        }}
      >
        <div>
          <div className="skeleton" style={{ width: "160px", height: "2rem", marginBottom: "0.5rem" }} />
          <div className="skeleton" style={{ width: "220px", height: "1rem" }} />
        </div>
        <div className="skeleton" style={{ width: "130px", height: "2.5rem" }} />
      </div>

      {/* Stats skeletons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div className="skeleton" style={{ width: "3rem", height: "2rem", margin: "0 auto 0.5rem" }} />
            <div className="skeleton" style={{ width: "80%", height: "0.875rem", margin: "0 auto" }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "var(--border-thick)" }}>
          <div className="skeleton" style={{ width: "120px", height: "1.25rem" }} />
        </div>
        <div style={{ padding: "1rem" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 3fr 1fr 1.5fr 1fr",
                gap: "1rem",
                padding: "0.875rem 0",
                borderBottom: i < 5 ? "var(--border)" : "none",
              }}
            >
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="skeleton" style={{ height: "1.25rem" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
