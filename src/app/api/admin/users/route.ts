import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { paginationSchema } from "@/lib/validations";
import { berhasilPaginated, gagal } from "@/lib/response";

// GET /api/admin/users  — paginated list of users with roles
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return gagal("Sesi Anda telah berakhir, silakan login kembali", 401);
  if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS)) {
    return gagal("Anda tidak memiliki akses untuk melakukan tindakan ini", 403);
  }

  const { searchParams } = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    const kesalahan = parsed.error.errors.map((e) => ({
      kolom: String(e.path[0] ?? ""),
      pesan: e.message,
    }));
    return gagal("Data yang dikirim tidak valid", 400, kesalahan);
  }
  const { page, limit } = parsed.data;
  const search = searchParams.get("search") ?? "";

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
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
  ]);

  return berhasilPaginated(users, {
    halaman: page,
    batas: limit,
    total,
    total_halaman: Math.ceil(total / limit),
  });
}
