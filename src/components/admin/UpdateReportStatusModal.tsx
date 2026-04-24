"use client";

import { useState, useTransition } from "react";
import { updateReportStatus } from "@/actions/admin.actions";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";

interface Props {
  reportId: string;
  currentStatus: string;
  userName: string;
  onDone?: () => void;
}

export function UpdateReportStatusModal({
  reportId,
  currentStatus,
  userName,
  onDone,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = (a: "approved" | "rejected") => {
    setAction(a);
    setReason("");
    setError(null);
    setIsOpen(true);
  };

  const close = () => {
    if (!isPending) {
      setIsOpen(false);
      setAction(null);
      setError(null);
    }
  };

  const confirm = () => {
    if (!action) return;
    if (action === "rejected" && !reason.trim()) {
      setError("Alasan penolakan wajib diisi");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateReportStatus(reportId, action, reason || undefined);
      if (result.sukses) {
        setIsOpen(false);
        onDone?.();
      } else {
        setError(result.pesan);
      }
    });
  };

  if (currentStatus !== "pending") {
    return <StatusBadge status={currentStatus} />;
  }

  return (
    <>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
        <StatusBadge status={currentStatus} />
        <button
          className="btn btn-success btn-sm"
          id={`btn-approve-${reportId}`}
          onClick={() => open("approved")}
          title="Setujui laporan"
        >
          ✓
        </button>
        <button
          className="btn btn-danger btn-sm"
          id={`btn-reject-${reportId}`}
          onClick={() => open("rejected")}
          title="Tolak laporan"
        >
          ✗
        </button>
      </div>

      <Modal
        isOpen={isOpen}
        title={action === "approved" ? "Setujui Laporan" : "Tolak Laporan"}
        onClose={close}
        onConfirm={confirm}
        confirmLabel={action === "approved" ? "Ya, Setujui" : "Ya, Tolak"}
        confirmVariant={action === "approved" ? "success" : "danger"}
        loading={isPending}
      >
        <p style={{ marginBottom: "1rem" }}>
          {action === "approved"
            ? `Setujui laporan dari ${userName}?`
            : `Tolak laporan dari ${userName}?`}
        </p>

        {action === "rejected" && (
          <div className="form-group">
            <label htmlFor={`reason-${reportId}`} className="label">
              Alasan Penolakan <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <textarea
              id={`reason-${reportId}`}
              className={`input ${error ? "input-error" : ""}`}
              rows={3}
              placeholder="Tuliskan alasan penolakan..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
            />
            {error && <p className="field-error">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
