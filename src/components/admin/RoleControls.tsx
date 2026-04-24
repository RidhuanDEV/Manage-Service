"use client";

import { useState, useTransition } from "react";
import { createRole, updateRole, deleteRole } from "@/actions/admin.actions";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  label: string;
  is_active: boolean;
  permissions: { permission: Permission }[];
  _count: { users: number };
}

// ─────────────────────────────────────────────
// Permission Checkbox Group
// ─────────────────────────────────────────────
function PermissionCheckboxGroup({
  permissions,
  selected,
  onChange,
  error,
}: {
  permissions: Permission[];
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string | null;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="form-group">
      <span className="label">Permissions</span>
      <div
        style={{
          border: `2px solid ${error ? "var(--color-danger)" : "#000"}`,
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxHeight: "240px",
          overflowY: "auto",
          background: "#FFFDF0",
        }}
      >
        {permissions.map((p) => (
          <label
            key={p.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.625rem",
              cursor: "pointer",
              padding: "0.375rem",
              background: selected.includes(p.id)
                ? "rgba(255,215,0,0.2)"
                : "transparent",
              border: selected.includes(p.id) ? "1.5px solid #000" : "1.5px solid transparent",
              transition: "background 80ms, border-color 80ms",
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => toggle(p.id)}
              style={{ marginTop: "2px", flexShrink: 0 }}
            />
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{p.name}</p>
              {p.description && (
                <p style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                  {p.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Create Role Modal
// ─────────────────────────────────────────────
export function CreateRoleModal({
  permissions,
}: {
  permissions: Permission[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setName("");
    setLabel("");
    setSelectedPerms([]);
    setErrors({});
    setServerError(null);
  };

  const open = () => {
    reset();
    setIsOpen(true);
  };

  const close = () => {
    if (!isPending) {
      setIsOpen(false);
    }
  };

  const confirm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nama role wajib diisi";
    if (!label.trim()) errs.label = "Label wajib diisi";
    if (selectedPerms.length === 0) errs.permissionIds = "Minimal 1 permission harus dipilih";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setServerError(null);
    startTransition(async () => {
      const result = await createRole({
        name: name.trim().toUpperCase().replace(/\s+/g, "_"),
        label: label.trim(),
        permissionIds: selectedPerms,
      });
      if (result.sukses) {
        setIsOpen(false);
      } else {
        if (result.kesalahan) {
          const fe: Record<string, string> = {};
          result.kesalahan.forEach((e) => { fe[e.kolom] = e.pesan; });
          setErrors(fe);
        }
        setServerError(result.pesan);
      }
    });
  };

  return (
    <>
      <Button variant="primary" onClick={open} id="btn-buat-role">
        + Buat Role
      </Button>

      <Modal
        isOpen={isOpen}
        title="Buat Role Baru"
        onClose={close}
        onConfirm={confirm}
        confirmLabel="Buat Role"
        loading={isPending}
      >
        {serverError && (
          <div
            style={{
              background: "#FFF0F0",
              border: "2px solid var(--color-danger)",
              padding: "0.75rem",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-danger)",
            }}
          >
            {serverError}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            id="create-role-name"
            label="Nama Role (akan diuppercase)"
            placeholder="Contoh: SENIOR_DEVELOPER"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            id="create-role-label"
            label="Label Tampilan"
            placeholder="Contoh: Senior Developer"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            error={errors.label}
          />
          <PermissionCheckboxGroup
            permissions={permissions}
            selected={selectedPerms}
            onChange={setSelectedPerms}
            error={errors.permissionIds}
          />
        </div>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────
// Edit Role Modal
// ─────────────────────────────────────────────
export function EditRoleModal({
  role,
  permissions,
}: {
  role: Role;
  permissions: Permission[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState(role.label);
  const [selectedPerms, setSelectedPerms] = useState<string[]>(
    role.permissions.map((p) => p.permission.id)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = () => {
    setLabel(role.label);
    setSelectedPerms(role.permissions.map((p) => p.permission.id));
    setErrors({});
    setServerError(null);
    setIsOpen(true);
  };

  const close = () => { if (!isPending) setIsOpen(false); };

  const confirm = () => {
    const errs: Record<string, string> = {};
    if (!label.trim()) errs.label = "Label wajib diisi";
    if (selectedPerms.length === 0) errs.permissionIds = "Minimal 1 permission harus dipilih";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    setServerError(null);
    startTransition(async () => {
      const result = await updateRole(role.id, {
        label: label.trim(),
        permissionIds: selectedPerms,
      });
      if (result.sukses) {
        setIsOpen(false);
      } else {
        if (result.kesalahan) {
          const fe: Record<string, string> = {};
          result.kesalahan.forEach((e) => { fe[e.kolom] = e.pesan; });
          setErrors(fe);
        }
        setServerError(result.pesan);
      }
    });
  };

  const isProtected = role.name === "ADMIN";

  return (
    <>
      <button
        className="btn btn-dark btn-sm"
        id={`btn-edit-role-${role.id}`}
        onClick={open}
        disabled={isProtected}
        title={isProtected ? "Role ADMIN tidak dapat diedit" : undefined}
      >
        Edit
      </button>

      <Modal
        isOpen={isOpen}
        title={`Edit Role — ${role.name}`}
        onClose={close}
        onConfirm={confirm}
        confirmLabel="Simpan"
        loading={isPending}
      >
        {serverError && (
          <div
            style={{
              background: "#FFF0F0",
              border: "2px solid var(--color-danger)",
              padding: "0.75rem",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-danger)",
            }}
          >
            {serverError}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            id={`edit-role-label-${role.id}`}
            label="Label Tampilan"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            error={errors.label}
          />
          <PermissionCheckboxGroup
            permissions={permissions}
            selected={selectedPerms}
            onChange={setSelectedPerms}
            error={errors.permissionIds}
          />
        </div>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────
// Delete Role Button
// ─────────────────────────────────────────────
export function DeleteRoleButton({
  role,
}: {
  role: Role;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isProtected = role.name === "ADMIN" || role._count.users > 0;

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteRole(role.id);
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
        className="btn btn-danger btn-sm"
        id={`btn-delete-role-${role.id}`}
        onClick={() => { setError(null); setIsOpen(true); }}
        disabled={isProtected}
        title={
          role.name === "ADMIN"
            ? "Role ADMIN tidak dapat dihapus"
            : role._count.users > 0
            ? `Masih digunakan oleh ${role._count.users} user`
            : undefined
        }
      >
        Hapus
      </button>

      <Modal
        isOpen={isOpen}
        title="Hapus Role?"
        onClose={() => { if (!isPending) setIsOpen(false); }}
        onConfirm={confirm}
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
        loading={isPending}
      >
        <p>
          Hapus role <strong>{role.label}</strong>? Tindakan ini tidak dapat
          dibatalkan.
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
