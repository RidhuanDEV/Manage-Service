import { useSession } from "next-auth/react";

// ---------------------------------------------------------------------------
// Server-side permission check (Server Component, Server Action)
// ---------------------------------------------------------------------------
export function hasPermission(
  permissions: string[],
  required: string
): boolean {
  return permissions.includes(required);
}

// ---------------------------------------------------------------------------
// Multi-permission check — returns true if ALL required permissions are present
// ---------------------------------------------------------------------------
export function hasAllPermissions(
  permissions: string[],
  required: string[]
): boolean {
  return required.every((p) => permissions.includes(p));
}

// ---------------------------------------------------------------------------
// Multi-permission check — returns true if ANY required permission is present
// ---------------------------------------------------------------------------
export function hasAnyPermission(
  permissions: string[],
  required: string[]
): boolean {
  return required.some((p) => permissions.includes(p));
}

// ---------------------------------------------------------------------------
// Client-side permission hook (Client Component via useSession)
// ---------------------------------------------------------------------------
export function usePermission(required: string): boolean {
  const { data: session } = useSession();
  return session?.user?.permissions?.includes(required) ?? false;
}

// ---------------------------------------------------------------------------
// Permission constants — single source of truth
// ---------------------------------------------------------------------------
export const PERMISSIONS = {
  CREATE_REPORT:         "create_report",
  VIEW_OWN_REPORTS:      "view_own_reports",
  VIEW_ALL_REPORTS:      "view_all_reports",
  MANAGE_USERS:          "manage_users",
  MANAGE_ROLES:          "manage_roles",
  EXPORT_PDF:            "export_pdf",
  UPDATE_REPORT_STATUS:  "update_report_status",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
