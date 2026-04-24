import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { paginationSchema } from "@/lib/validations";
import { Pagination } from "@/components/ui/Pagination";
import { UpdateUserRoleModal, ToggleUserButton } from "@/components/admin/UserControls";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola User — Manage Service",
  description: "Kelola akun dan role karyawan",
};

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; search?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS)) {
    redirect("/dashboard");
  }

  const raw = await searchParams;
  const { page, limit } = paginationSchema.parse(raw);
  const search = raw.search ?? "";

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    }),
  };

  const [users, total, roles] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        deleted_at: true,
        created_at: true,
        role: { select: { id: true, name: true, label: true } },
        _count: { select: { reports: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.role.findMany({
      where: { is_active: true },
      select: { id: true, name: true, label: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

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
          <h1 className="section-title">Kelola User</h1>
          <p style={{ color: "var(--color-muted)", marginTop: "0.25rem" }}>
            Total <strong>{total}</strong> akun terdaftar
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}>
        <form method="GET" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <span className="label">Cari User</span>
            <input
              id="user-search"
              name="search"
              className="input"
              type="text"
              placeholder="Nama atau email..."
              defaultValue={search}
            />
          </div>
          <button type="submit" className="btn btn-primary" id="btn-cari-user">
            Cari
          </button>
          {search && (
            <a href="/admin/users" className="btn btn-secondary" id="btn-reset-user-search">
              Reset
            </a>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {users.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-muted)" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>👥</p>
            <p style={{ fontWeight: 700 }}>Tidak ada user ditemukan</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-neo">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>Nama</th>
                  <th style={{ width: "25%" }}>Email</th>
                  <th style={{ width: "20%" }}>Role</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Laporan</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Status</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isActive = !user.deleted_at;
                  const isSelf = user.id === session.user.id;
                  return (
                    <tr key={user.id} style={{ opacity: isActive ? 1 : 0.55 }}>
                      <td>
                        <span style={{ fontWeight: 700 }}>{user.name}</span>
                        {isSelf && (
                          <span
                            style={{
                              marginLeft: "0.5rem",
                              fontSize: "0.7rem",
                              background: "var(--color-primary)",
                              border: "2px solid #000",
                              padding: "0 0.35rem",
                              fontWeight: 700,
                            }}
                          >
                            Anda
                          </span>
                        )}
                        <br />
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                          Bergabung{" "}
                          {user.created_at.toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.9rem",
                            wordBreak: "break-all",
                          }}
                        >
                          {user.email}
                        </span>
                      </td>
                      <td>
                        {isSelf ? (
                          // Can't change own role
                          <span
                            style={{
                              background: "var(--color-primary)",
                              border: "2px solid #000",
                              padding: "0.125rem 0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            {user.role.label}
                          </span>
                        ) : (
                          <UpdateUserRoleModal
                            userId={user.id}
                            currentRoleId={user.role.id}
                            userName={user.name}
                            roles={roles}
                          />
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontWeight: 800,
                            fontSize: "1.125rem",
                          }}
                        >
                          {user._count.reports}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.2rem 0.6rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            border: "2px solid #000",
                            background: isActive
                              ? "var(--color-success)"
                              : "var(--color-danger)",
                            color: isActive ? "#000" : "#fff",
                          }}
                        >
                          {isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {!isSelf && (
                          <ToggleUserButton
                            userId={user.id}
                            isActive={isActive}
                            userName={user.name}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: "0 1.5rem", borderTop: "var(--border)" }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              limit={limit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
