import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { berhasil, gagal } from "@/lib/response";
import { notFound } from "next/navigation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session) return gagal("Sesi Anda telah berakhir, silakan login kembali", 401);

  const { id } = await params;

  const report = await prisma.report.findFirst({
    where: { id, deleted_at: null },
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
  });

  if (!report) return gagal("Data tidak ditemukan", 404);

  // Ownership check
  const isAdmin = hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS);
  if (!isAdmin && report.user_id !== session.user.id) {
    return gagal("Anda tidak memiliki akses untuk melakukan tindakan ini", 403);
  }

  return berhasil(report);
}
