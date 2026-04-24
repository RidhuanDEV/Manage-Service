"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger" | "success" | "dark";
  cancelLabel?: string;
  loading?: boolean;
}

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = "Konfirmasi",
  confirmVariant = "primary",
  cancelLabel = "Batal",
  loading = false,
}: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus trap — focus close button on mount
  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <h2 id="modal-title" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.25rem" }}>
            {title}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Tutup modal"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 0.25rem",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>{children}</div>

        {onConfirm && (
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
