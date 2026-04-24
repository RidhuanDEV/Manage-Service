import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validations";
import { berhasilPaginated, gagal } from "@/lib/response";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return gagal("Sesi Anda telah berakhir, silakan login kembali", 401);

  const { searchParams } = new URL(req.url);
  const { page, limit } = paginationSchema.parse(Object.fromEntries(searchParams));

  const where = { user_id: session.user.id, deleted_at: null } as const;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        description: true,
        work_start: true,
        work_end: true,
        status: true,
        created_at: true,
        reject_reason: true,
      },
    }),
    prisma.report.count({ where }),
  ]);

  return berhasilPaginated(reports, {
    halaman: page,
    batas: limit,
    total,
    total_halaman: Math.ceil(total / limit),
  });
}
