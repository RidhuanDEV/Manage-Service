type StatusBadge = "pending" | "approved" | "rejected";

interface BadgeProps {
  variant?: StatusBadge | "admin" | "default";
  children: React.ReactNode;
  className?: string;
}

const LABEL_MAP: Partial<Record<StatusBadge, string>> = {
  pending:  "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}

// Convenience: auto-label from status string
export function StatusBadge({ status }: { status: string }) {
  const v = (status as StatusBadge) in LABEL_MAP ? (status as StatusBadge) : "default";
  return (
    <Badge variant={v}>{LABEL_MAP[v as StatusBadge] ?? status}</Badge>
  );
}
