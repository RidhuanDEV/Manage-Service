import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { reportFilterSchema } from "@/lib/validations";
import { berhasilPaginated, gagal } from "@/lib/response";
import type { Prisma } from "@prisma/client";

// GET /api/admin/reports  — list all reports with filters (admin only)
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return gagal("Sesi Anda telah berakhir, silakan login kembali", 401);
  if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS)) {
    return gagal("Anda tidak memiliki akses untuk melakukan tindakan ini", 403);
  }

  const { searchParams } = new URL(req.url);
  const filters = reportFilterSchema.parse(Object.fromEntries(searchParams));

  const where: Prisma.ReportWhereInput = {
    deleted_at: null,
    ...(filters.status && { status: filters.status }),
    ...(filters.role && { user: { role: { name: filters.role } } }),
    ...(filters.search && {
      OR: [
        { description: { contains: filters.search } },
        { user: { name: { contains: filters.search } } },
      ],
    }),
    ...(filters.date_from || filters.date_to
      ? {
          work_start: {
            ...(filters.date_from && { gte: new Date(filters.date_from) }),
            ...(filters.date_to && { lte: new Date(filters.date_to + "T23:59:59") }),
          },
        }
      : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: { select: { name: true, label: true } },
          },
        },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return berhasilPaginated(reports, {
    halaman: filters.page,
    batas: filters.limit,
    total,
    total_halaman: Math.ceil(total / filters.limit),
  });
}
