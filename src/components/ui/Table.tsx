interface TableProps {
  headers: { key: string; label: string; width?: string }[];
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function Table({
  headers,
  children,
  className = "",
  emptyMessage = "Data tidak ditemukan",
  isEmpty = false,
}: TableProps) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className={`table-neo ${className}`}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h.key} style={h.width ? { width: h.width } : {}}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)", fontWeight: 600 }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
