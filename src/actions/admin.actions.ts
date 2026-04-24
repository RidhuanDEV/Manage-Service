"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  updateReportStatusSchema,
  updateUserRoleSchema,
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
} from "@/lib/validations";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Guard helper — throws ActionResult-compatible response if not admin
// ---------------------------------------------------------------------------
async function requirePermission(
  permission: string
): Promise<{ sukses: false; pesan: string } | null> {
  const session = await auth();
  if (!session) {
    return { sukses: false, pesan: "Sesi Anda telah berakhir, silakan login kembali" };
  }
  if (!hasPermission(session.user.permissions, permission)) {
    return { sukses: false, pesan: "Anda tidak memiliki akses untuk melakukan tindakan ini" };
  }
  return null; // OK
}

// ---------------------------------------------------------------------------
// updateReportStatus — admin approve / reject laporan
// ---------------------------------------------------------------------------

export async function updateReportStatus(
  reportId: string,
  status: "approved" | "rejected",
  reason?: string
): Promise<ActionResult> {
  const guard = await requirePermission(PERMISSIONS.UPDATE_REPORT_STATUS);
  if (guard) return guard;

  const parsed = updateReportStatusSchema.safeParse({ reportId, status, reason });
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: parsed.error.errors.map((e) => ({
        kolom: String(e.path[0] ?? ""),
        pesan: e.message,
      })),
    };
  }

  const report = await prisma.report.findFirst({
    where: { id: reportId, deleted_at: null },
    select: { id: true, status: true },
  });

  if (!report) return { sukses: false, pesan: "Data tidak ditemukan" };
  if (report.status !== "pending") {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: [{ kolom: "status", pesan: "Hanya laporan dengan status menunggu yang dapat diubah" }],
    };
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reject_reason: status === "rejected" ? (parsed.data.reason ?? null) : null,
      },
    });

    revalidatePath("/admin/reports");
    revalidatePath(`/reports/${reportId}`);
    return { sukses: true, pesan: `Laporan berhasil ${status === "approved" ? "disetujui" : "ditolak"}` };
  } catch (error: unknown) {
    console.error("[updateReportStatus]", error);
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}

// ---------------------------------------------------------------------------
// updateUserRole — admin ganti role user
// ---------------------------------------------------------------------------

export async function updateUserRole(
  userId: string,
  roleId: string
): Promise<ActionResult> {
  const guard = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (guard) return guard;

  const parsed = updateUserRoleSchema.safeParse({ userId, roleId });
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: parsed.error.errors.map((e) => ({
        kolom: String(e.path[0] ?? ""),
        pesan: e.message,
      })),
    };
  }

  const [user, role] = await Promise.all([
    prisma.user.findFirst({ where: { id: userId, deleted_at: null }, select: { id: true } }),
    prisma.role.findFirst({ where: { id: roleId, is_active: true }, select: { id: true } }),
  ]);

  if (!user) return { sukses: false, pesan: "Data tidak ditemukan" };
  if (!role)  return { sukses: false, pesan: "Role tidak ditemukan atau tidak aktif" };

  try {
    await prisma.user.update({ where: { id: userId }, data: { role_id: roleId } });
    revalidatePath("/admin/users");
    return { sukses: true, pesan: "Role user berhasil diperbarui" };
  } catch (error: unknown) {
    console.error("[updateUserRole]", error);
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}

// ---------------------------------------------------------------------------
// toggleUserStatus — soft delete / restore user
// ---------------------------------------------------------------------------

export async function toggleUserStatus(userId: string): Promise<ActionResult> {
  const guard = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (guard) return guard;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deleted_at: true, role: { select: { name: true } } },
  });

  if (!user) return { sukses: false, pesan: "Data tidak ditemukan" };

  // Prevent deactivating the last admin
  if (!user.deleted_at && user.role.name === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: { name: "ADMIN" }, deleted_at: null },
    });
    if (adminCount <= 1) {
      return {
        sukses: false,
        pesan: "Tidak dapat menonaktifkan admin terakhir",
      };
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { deleted_at: user.deleted_at ? null : new Date() },
    });

    revalidatePath("/admin/users");
    return {
      sukses: true,
      pesan: user.deleted_at ? "User berhasil diaktifkan kembali" : "User berhasil dinonaktifkan",
    };
  } catch (error: unknown) {
    console.error("[toggleUserStatus]", error);
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}

// ---------------------------------------------------------------------------
// createRole — buat role baru dengan permissions
// ---------------------------------------------------------------------------

export async function createRole(input: CreateRoleInput): Promise<ActionResult<{ id: string }>> {
  const guard = await requirePermission(PERMISSIONS.MANAGE_ROLES);
  if (guard) return guard;

  const parsed = createRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: parsed.error.errors.map((e) => ({
        kolom: String(e.path[0] ?? ""),
        pesan: e.message,
      })),
    };
  }

  const { name, label, permissionIds } = parsed.data;

  // Check unique name
  const existing = await prisma.role.findUnique({ where: { name }, select: { id: true } });
  if (existing) {
    return {
      sukses: false,
      pesan: "Data sudah terdaftar",
      kesalahan: [{ kolom: "name", pesan: "Nama role sudah digunakan" }],
    };
  }

  // Verify all permissions exist
  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
    select: { id: true },
  });
  if (permissions.length !== permissionIds.length) {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: [{ kolom: "permissionIds", pesan: "Beberapa permission tidak ditemukan" }],
    };
  }

  try {
    const role = await prisma.role.create({
      data: {
        name,
        label,
        permissions: {
          create: permissionIds.map((pid) => ({ permission_id: pid })),
        },
      },
      select: { id: true },
    });

    revalidatePath("/admin/roles");
    return { sukses: true, pesan: "Role berhasil dibuat", data: role };
  } catch (error: unknown) {
    console.error("[createRole]", error);
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}

// ---------------------------------------------------------------------------
// updateRole — update label dan/atau permissions
// ---------------------------------------------------------------------------

export async function updateRole(
  roleId: string,
  input: UpdateRoleInput
): Promise<ActionResult> {
  const guard = await requirePermission(PERMISSIONS.MANAGE_ROLES);
  if (guard) return guard;

  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: parsed.error.errors.map((e) => ({
        kolom: String(e.path[0] ?? ""),
        pesan: e.message,
      })),
    };
  }

  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true, name: true } });
  if (!role) return { sukses: false, pesan: "Data tidak ditemukan" };

  const { label, permissionIds } = parsed.data;

  // Check name uniqueness if provided
  if (parsed.data.name && parsed.data.name !== role.name) {
    const nameExists = await prisma.role.findUnique({ where: { name: parsed.data.name }, select: { id: true } });
    if (nameExists) {
      return {
        sukses: false,
        pesan: "Data sudah terdaftar",
        kesalahan: [{ kolom: "name", pesan: "Nama role sudah digunakan" }],
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (permissionIds !== undefined) {
        // Replace permissions atomically
        await tx.rolePermission.deleteMany({ where: { role_id: roleId } });
        await tx.rolePermission.createMany({
          data: permissionIds.map((pid) => ({ role_id: roleId, permission_id: pid })),
        });
      }

      await tx.role.update({
        where: { id: roleId },
        data: {
          ...(parsed.data.name  && { name: parsed.data.name }),
          ...(label             && { label }),
        },
      });
    });

    revalidatePath("/admin/roles");
    return { sukses: true, pesan: "Role berhasil diperbarui" };
  } catch (error: unknown) {
    console.error("[updateRole]", error);
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}

// ---------------------------------------------------------------------------
// deleteRole — hapus role (cek tidak ada user aktif dulu)
// ---------------------------------------------------------------------------

export async function deleteRole(roleId: string): Promise<ActionResult> {
  const guard = await requirePermission(PERMISSIONS.MANAGE_ROLES);
  if (guard) return guard;

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { id: true, name: true, _count: { select: { users: true } } },
  });

  if (!role) return { sukses: false, pesan: "Data tidak ditemukan" };

  // Prevent deleting ADMIN role
  if (role.name === "ADMIN") {
    return { sukses: false, pesan: "Role ADMIN tidak dapat dihapus" };
  }

  // Cek ada user aktif menggunakan role ini
  const activeUsers = await prisma.user.count({
    where: { role_id: roleId, deleted_at: null },
  });
  if (activeUsers > 0) {
    return {
      sukses: false,
      pesan: `Tidak dapat menghapus role yang masih digunakan oleh ${activeUsers} pengguna aktif`,
    };
  }

  try {
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { role_id: roleId } }),
      prisma.role.delete({ where: { id: roleId } }),
    ]);

    revalidatePath("/admin/roles");
    return { sukses: true, pesan: "Role berhasil dihapus" };
  } catch (error: unknown) {
    console.error("[deleteRole]", error);
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}

// ---------------------------------------------------------------------------
// updateRolePermissions — replace seluruh permission sebuah role
// ---------------------------------------------------------------------------

export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult> {
  const guard = await requirePermission(PERMISSIONS.MANAGE_ROLES);
  if (guard) return guard;

  if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: [{ kolom: "permissionIds", pesan: "Minimal 1 permission harus dipilih" }],
    };
  }

  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
  if (!role) return { sukses: false, pesan: "Data tidak ditemukan" };

  try {
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { role_id: roleId } }),
      prisma.rolePermission.createMany({
        data: permissionIds.map((pid) => ({ role_id: roleId, permission_id: pid })),
      }),
    ]);

    revalidatePath("/admin/roles");
    return { sukses: true, pesan: "Permission role berhasil diperbarui" };
  } catch (error: unknown) {
    console.error("[updateRolePermissions]", error);
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}
