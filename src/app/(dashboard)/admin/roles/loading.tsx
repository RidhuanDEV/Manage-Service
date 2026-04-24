// Loading skeleton for admin roles page
export default function AdminRolesLoading() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.75rem", gap: "1rem" }}>
        <div>
          <div className="skeleton" style={{ width: "160px", height: "2rem", marginBottom: "0.5rem" }} />
          <div className="skeleton" style={{ width: "240px", height: "1rem" }} />
        </div>
        <div className="skeleton" style={{ width: "120px", height: "2.5rem" }} />
      </div>

      {/* Legend skeleton */}
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}>
        <div className="skeleton" style={{ width: "160px", height: "1rem", marginBottom: "0.75rem" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="skeleton" style={{ width: `${80 + i * 15}px`, height: "1.75rem" }} />
          ))}
        </div>
      </div>

      {/* Role cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="skeleton" style={{ width: "140px", height: "1.5rem" }} />
                <div className="skeleton" style={{ width: "100px", height: "1.5rem" }} />
              </div>
              <div className="skeleton" style={{ width: "160px", height: "1rem" }} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div className="skeleton" style={{ width: "70px", height: "2rem" }} />
              <div className="skeleton" style={{ width: "70px", height: "2rem" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="skeleton" style={{ width: `${70 + j * 20}px`, height: "1.75rem" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
