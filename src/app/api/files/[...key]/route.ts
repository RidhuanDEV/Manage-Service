import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl } from "@/lib/minio";
import { gagal } from "@/lib/response";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /api/files/[...key]
// Serve file dari MinIO — verifikasi session + ownership
// Redirect ke presigned URL (expire 1 jam)
// ---------------------------------------------------------------------------

interface RouteContext {
  params: Promise<{ key: string[] }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  // 1. Verifikasi session
  const session = await auth();
  if (!session) {
    return gagal("Sesi Anda telah berakhir, silakan login kembali", 401);
  }

  // 2. Reconstruct object key dari path segments
  const { key: keySegments } = await params;
  if (!keySegments || keySegments.length === 0) {
    return gagal("Data tidak ditemukan", 404);
  }
  const objectKey = keySegments.join("/");

  // 3. Validate key format — prevent path traversal
  //    Key format: reports/{userId}/{uuid}.{ext}
  if (objectKey.includes("..") || objectKey.includes("//")) {
    return gagal("Data tidak ditemukan", 404);
  }

  // 4. Verifikasi ownership
  //    Admin bisa akses semua file
  //    User biasa hanya bisa akses file miliknya (key mengandung userId)
  const isAdmin = hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS);

  if (!isAdmin) {
    // Key pattern: reports/{userId}/{filename}
    const keyParts = objectKey.split("/");
    if (keyParts.length < 3 || keyParts[0] !== "reports") {
      return gagal("Anda tidak memiliki akses untuk melakukan tindakan ini", 403);
    }

    const ownerUserId = keyParts[1];

    // Check by userId in key
    if (ownerUserId !== session.user.id) {
      // Fallback: query DB to verify the file belongs to a report owned by this user
      const report = await prisma.report.findFirst({
        where: {
          user_id: session.user.id,
          deleted_at: null,
          OR: [
            { before_image_key: objectKey },
            { after_image_key:  objectKey },
          ],
        },
        select: { id: true },
      });

      if (!report) {
        return gagal("Anda tidak memiliki akses untuk melakukan tindakan ini", 403);
      }
    }
  }

  // 5. Generate presigned URL dan redirect
  try {
    const presignedUrl = await getPresignedUrl(objectKey);
    return NextResponse.redirect(presignedUrl, { status: 302 });
  } catch (error) {
    console.error("[GET /api/files]", error);
    return gagal("Data tidak ditemukan", 404);
  }
}
