import { auth } from "@/lib/auth";
import { gagal } from "@/lib/response";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { generateLaporanPDF } from "@/lib/pdf";
import type { ReportFilters } from "@/types";

// ---------------------------------------------------------------------------
// GET /api/admin/reports/export-pdf
// Query params: role, status, date_from, date_to, search
// Streams PDF binary response
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  // 1. Verifikasi session + permission
  const session = await auth();
  if (!session) {
    return gagal("Sesi Anda telah berakhir, silakan login kembali", 401);
  }
  if (!hasPermission(session.user.permissions, PERMISSIONS.EXPORT_PDF)) {
    return gagal("Anda tidak memiliki akses untuk melakukan tindakan ini", 403);
  }

  // 2. Parse query params
  const { searchParams } = new URL(req.url);

  const filters: ReportFilters = {
    role:      searchParams.get("role")      ?? undefined,
    status:    (searchParams.get("status") as ReportFilters["status"]) ?? undefined,
    search:    searchParams.get("search")    ?? undefined,
    date_from: searchParams.get("date_from") ?? undefined,
    date_to:   searchParams.get("date_to")   ?? undefined,
  };

  // 3. Generate PDF buffer
  try {
    const pdfBuffer = await generateLaporanPDF(filters);

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 15); // YYYYMMDD_HHmmss

    const filename = `laporan_${timestamp}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      pdfBuffer.byteLength.toString(),
        // Prevent caching of sensitive data
        "Cache-Control":       "no-store, no-cache, must-revalidate",
        "Pragma":              "no-cache",
      },
    });
  } catch (error) {
    console.error("[export-pdf]", error);
    return gagal("Terjadi kesalahan saat membuat PDF, silakan hubungi administrator", 500);
  }
}
