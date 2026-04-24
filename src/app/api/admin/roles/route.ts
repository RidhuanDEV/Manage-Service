import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { berhasil, gagal } from "@/lib/response";

// GET /api/admin/roles  — list all roles with permissions and user count
export async function GET(_req: Request) {
  const session = await auth();
  if (!session) return gagal("Sesi Anda telah berakhir, silakan login kembali", 401);
  if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_ROLES)) {
    return gagal("Anda tidak memiliki akses untuk melakukan tindakan ini", 403);
  }

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: { created_at: "asc" },
      include: {
        permissions: {
          include: {
            permission: { select: { id: true, name: true, description: true } },
          },
        },
        _count: { select: { users: true } },
      },
    }),
    prisma.permission.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    }),
  ]);

  return berhasil({ roles, permissions });
}
