import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  CreateRoleModal,
  EditRoleModal,
  DeleteRoleButton,
} from "@/components/admin/RoleControls";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Role — Manage Service",
  description: "Kelola role dan permission karyawan",
};

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

async function getRolesAndPermissions(
  cookieHeader: string,
): Promise<{ roles: Role[]; permissions: Permission[] }> {
  const url = new URL(
    "/api/admin/roles",
    process.env.INTERNAL_API_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  );
  const res = await fetch(url.toString(), {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return { roles: [], permissions: [] };
  const json = await res.json();
  return {
    roles: json.data?.roles ?? [],
    permissions: json.data?.permissions ?? [],
  };
}

export default async function AdminRolesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_ROLES)) {
    redirect("/dashboard");
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const { roles, permissions } = await getRolesAndPermissions(cookieHeader);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1 className="section-title">Kelola Role</h1>
          <p style={{ color: "var(--color-muted)", marginTop: "0.25rem" }}>
            {roles.length} role terdaftar · {permissions.length} permission
            tersedia
          </p>
        </div>
        <CreateRoleModal permissions={permissions} />
      </div>

      {/* Permission Legend */}
      <div
        className="card"
        style={{
          marginBottom: "1.25rem",
          padding: "1rem 1.25rem",
          background: "rgba(255,215,0,0.08)",
          borderColor: "var(--color-primary)",
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: "0.8125rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.625rem",
          }}
        >
          🔑 Daftar Permission
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {permissions.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#fff",
                border: "2px solid #000",
                padding: "0.25rem 0.625rem",
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                {p.name}
              </span>
              {p.description && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-muted)",
                    marginLeft: "0.375rem",
                  }}
                >
                  — {p.description}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Roles list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {roles.map((role) => {
          const isProtected = role.name === "ADMIN";
          return (
            <div key={role.id} className="card">
              {/* Role header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 800,
                        fontSize: "1.0625rem",
                      }}
                    >
                      {role.label}
                    </h2>
                    <code
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        background: "var(--color-dark)",
                        color: "var(--color-primary)",
                        padding: "0.1rem 0.5rem",
                      }}
                    >
                      {role.name}
                    </code>
                    {isProtected && (
                      <span
                        style={{
                          background: "var(--color-primary)",
                          border: "2px solid #000",
                          padding: "0.1rem 0.5rem",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        🔒 Protected
                      </span>
                    )}
                    {!role.is_active && (
                      <span
                        style={{
                          background: "var(--color-danger)",
                          color: "#fff",
                          border: "2px solid #000",
                          padding: "0.1rem 0.5rem",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}
                      >
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-muted)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {role._count.users} user menggunakan role ini
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <EditRoleModal role={role} permissions={permissions} />
                  <DeleteRoleButton role={role} />
                </div>
              </div>

              {/* Permissions for this role */}
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-muted)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Permissions ({role.permissions.length})
                </p>
                {role.permissions.length === 0 ? (
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-muted)",
                    }}
                  >
                    Tidak ada permission
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.375rem",
                    }}
                  >
                    {role.permissions.map(({ permission }) => (
                      <span
                        key={permission.id}
                        style={{
                          background: "#FFFDF0",
                          border: "2px solid #000",
                          padding: "0.2rem 0.6rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {permission.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
