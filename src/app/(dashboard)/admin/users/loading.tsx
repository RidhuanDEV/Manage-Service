// Loading skeleton for admin users page
export default function AdminUsersLoading() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.75rem", gap: "1rem" }}>
        <div>
          <div className="skeleton" style={{ width: "160px", height: "2rem", marginBottom: "0.5rem" }} />
          <div className="skeleton" style={{ width: "200px", height: "1rem" }} />
        </div>
      </div>

      {/* Search skeleton */}
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "80px", height: "0.875rem", marginBottom: "0.375rem" }} />
            <div className="skeleton" style={{ width: "100%", height: "2.5rem" }} />
          </div>
          <div className="skeleton" style={{ width: "80px", height: "2.5rem", alignSelf: "flex-end" }} />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem" }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 2fr 1fr 1fr 1fr",
                gap: "1rem",
                padding: "0.875rem 0",
                borderBottom: i < 7 ? "var(--border)" : "none",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="skeleton" style={{ height: "1.25rem" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
