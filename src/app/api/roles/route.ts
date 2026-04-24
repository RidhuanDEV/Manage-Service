import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { berhasil, gagal } from "@/lib/response";

// GET /api/roles  — list public active non-ADMIN roles (for register page)
export async function GET(_req: Request) {
  // No auth required — this is for the registration form
  const roles = await prisma.role.findMany({
    where: {
      is_active: true,
      name: { not: "ADMIN" },
    },
    select: { id: true, name: true, label: true },
    orderBy: { label: "asc" },
  });

  return berhasil(roles);
}
