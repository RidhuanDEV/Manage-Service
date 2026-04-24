import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger" | "success" | "dark";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      confirmVariant={variant}
      loading={loading}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{
          background: variant === "danger" ? "var(--color-danger)" : "var(--color-primary)",
          color: variant === "danger" ? "#fff" : "#000",
          padding: "0.5rem",
          border: "2px solid #000",
          boxShadow: "2px 2px 0px #000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <AlertTriangle strokeWidth={3} size={24} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.5, color: "var(--color-dark)" }}>
            {description}
          </p>
        </div>
      </div>
    </Modal>
  );
}
