"use client";

import { useState, useTransition } from "react";
import { updateUserRole, toggleUserStatus } from "@/actions/admin.actions";
import { Modal } from "@/components/ui/Modal";

// ─────────────────────────────────────────────
// Update Role Modal
// ─────────────────────────────────────────────

interface RoleOption {
  id: string;
  label: string;
  name: string;
}

interface UpdateRoleProps {
  userId: string;
  currentRoleId: string;
  userName: string;
  roles: RoleOption[];
}

export function UpdateUserRoleModal({
  userId,
  currentRoleId,
  userName,
  roles,
}: UpdateRoleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRoleId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = () => {
    setSelectedRole(currentRoleId);
    setError(null);
    setIsOpen(true);
  };

  const close = () => {
    if (!isPending) setIsOpen(false);
  };

  const confirm = () => {
    if (selectedRole === currentRoleId) {
      setIsOpen(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, selectedRole);
      if (result.sukses) {
        setIsOpen(false);
      } else {
        setError(result.pesan);
      }
    });
  };

  const currentRole = roles.find((r) => r.id === currentRoleId);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            background: "var(--color-primary)",
            border: "2px solid #000",
            padding: "0.125rem 0.5rem",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          {currentRole?.label ?? "—"}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          id={`btn-change-role-${userId}`}
          onClick={open}
        >
          Ganti
        </button>
      </div>

      <Modal
        isOpen={isOpen}
        title={`Ganti Role — ${userName}`}
        onClose={close}
        onConfirm={confirm}
        confirmLabel="Simpan"
        confirmVariant="primary"
        loading={isPending}
      >
        <div className="form-group">
          <label htmlFor={`role-select-${userId}`} className="label">
            Pilih Role Baru
          </label>
          <select
            id={`role-select-${userId}`}
            className="input"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id} disabled={r.name === "ADMIN"}>
                {r.label} {r.name === "ADMIN" ? "(terbatas)" : ""}
              </option>
            ))}
          </select>
          {error && <p className="field-error">{error}</p>}
        </div>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────
// Toggle User Status Button
// ─────────────────────────────────────────────

interface ToggleProps {
  userId: string;
  isActive: boolean;
  userName: string;
}

export function ToggleUserButton({ userId, isActive, userName }: ToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleUserStatus(userId);
      if (result.sukses) {
        setIsOpen(false);
      } else {
        setError(result.pesan);
      }
    });
  };

  return (
    <>
      <button
        className={`btn btn-sm ${isActive ? "btn-danger" : "btn-success"}`}
        id={`btn-toggle-user-${userId}`}
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
      >
        {isActive ? "Nonaktifkan" : "Aktifkan"}
      </button>

      <Modal
        isOpen={isOpen}
        title={isActive ? "Nonaktifkan User?" : "Aktifkan User?"}
        onClose={() => { if (!isPending) setIsOpen(false); }}
        onConfirm={confirm}
        confirmLabel={isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        confirmVariant={isActive ? "danger" : "success"}
        loading={isPending}
      >
        <p>
          {isActive
            ? `User ${userName} akan dinonaktifkan dan tidak bisa login.`
            : `User ${userName} akan diaktifkan kembali.`}
        </p>
        {error && (
          <p className="field-error" style={{ marginTop: "0.75rem" }}>
            {error}
          </p>
        )}
      </Modal>
    </>
  );
}
