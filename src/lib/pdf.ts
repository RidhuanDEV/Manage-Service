import path from "path";
import { getFileBuffer } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import type { ReportFilters } from "@/types";

// ---------------------------------------------------------------------------
// pdfmake — server-side import (no bundled vfs_fonts / Roboto)
// ---------------------------------------------------------------------------

// pdfmake does not have proper ESM types; require() is the only supported
// server-side import strategy per the pdfmake documentation.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require("pdfmake");

type PdfMakePrinter = {
  createPdfKitDocument: (
    docDefinition: object,
    options?: object
  ) => NodeJS.EventEmitter & {
    pipe: (stream: NodeJS.WritableStream) => void;
    end: () => void;
  };
};

// ---------------------------------------------------------------------------
// Font loading — use absolute paths for server-side PdfPrinter
// ---------------------------------------------------------------------------

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

// Font family definition — maps style names to absolute paths
const fonts = {
  Arial: {
    normal:      path.join(FONTS_DIR, "ARIAL.TTF"),
    bold:        path.join(FONTS_DIR, "ARIALBD.TTF"),
    italics:     path.join(FONTS_DIR, "ARIALI.TTF"),
    bolditalics: path.join(FONTS_DIR, "ARIALBI.TTF"),
  },
};

function getPrinter(): PdfMakePrinter {
  return new PdfPrinter(fonts);
}

// ---------------------------------------------------------------------------
// Image helper — fetch from MinIO as base64
// ---------------------------------------------------------------------------

async function imageToBase64(key: string): Promise<string | null> {
  try {
    const buffer = await getFileBuffer(key);
    const base64 = buffer.toString("base64");
    const ext  = key.split(".").pop()?.toLowerCase() ?? "jpeg";
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(start: Date, end: Date): string {
  const diffMs       = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours        = Math.floor(totalMinutes / 60);
  const minutes      = totalMinutes % 60;
  return `${hours}j ${minutes}m`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("id-ID", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// generateLaporanPDF
// ---------------------------------------------------------------------------

export async function generateLaporanPDF(
  filters: ReportFilters
): Promise<Buffer> {
  const where: Record<string, unknown> = { deleted_at: null };

  if (filters.status) where.status = filters.status;
  if (filters.date_from || filters.date_to) {
    where.created_at = {
      ...(filters.date_from && { gte: new Date(filters.date_from) }),
      ...(filters.date_to   && { lte: new Date(filters.date_to + "T23:59:59") }),
    };
  }
  if (filters.role)   where.user = { role: { name: filters.role } };
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search } },
      { user: { name: { contains: filters.search } } },
    ];
  }

  const reports = await prisma.report.findMany({
    where,
    include: { user: { include: { role: { select: { label: true } } } } },
    orderBy: { created_at: "desc" },
    take: 500,
  });

  const filterLabel =
    [
      filters.role      ? `Role: ${filters.role}`         : "",
      filters.status    ? `Status: ${filters.status}`     : "",
      filters.date_from ? `Dari: ${filters.date_from}`    : "",
      filters.date_to   ? `Sampai: ${filters.date_to}`    : "",
    ]
      .filter(Boolean)
      .join(" | ") || "Semua";

  const exportDate = new Date().toLocaleString("id-ID", {
    day:    "2-digit",
    month:  "long",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });

  // Build table rows
  const rows: object[][] = [];

  for (const report of reports) {
    const afterImageData = await imageToBase64(report.after_image_key);

    const imageCell = afterImageData
      ? { image: afterImageData, fit: [150, 190], alignment: "center" }
      : { text: "Gambar tidak tersedia", color: "#999", fontSize: 9, italics: true };

    rows.push([
      {
        stack: [
          { text: report.user.role.label, bold: true,  fontSize: 10 },
          { text: report.user.name,       fontSize: 9, color: "#555", margin: [0, 2, 0, 0] },
        ],
      },
      {
        stack: [
          { text: formatDuration(report.work_start, report.work_end), bold: true, fontSize: 10 },
          { text: formatDateTime(report.work_start), fontSize: 8, color: "#555", margin: [0, 2, 0, 0] },
          { text: "s/d",                             fontSize: 8, color: "#aaa" },
          { text: formatDateTime(report.work_end),   fontSize: 8, color: "#555" },
        ],
      },
      imageCell,
      { text: report.description, fontSize: 9, lineHeight: 1.4 },
    ]);
  }

  const docDefinition = {
    pageSize:        "A4",
    pageOrientation: "landscape",
    pageMargins:     [30, 50, 30, 50],

    header: {
      text:      `Laporan Karyawan — ${filterLabel} — ${exportDate}`,
      fontSize:  9,
      color:     "#555",
      alignment: "right",
      margin:    [30, 15, 30, 0],
    },

    footer: (currentPage: number, pageCount: number) => ({
      text:      `Halaman ${currentPage} dari ${pageCount}`,
      fontSize:  9,
      color:     "#aaa",
      alignment: "center",
      margin:    [0, 10, 0, 0],
    }),

    content: [
      {
        text:      "LAPORAN KARYAWAN",
        style:     "title",
        alignment: "center",
        margin:    [0, 0, 0, 4],
      },
      {
        text:      `Filter: ${filterLabel}  |  Diekspor: ${exportDate}  |  Total: ${reports.length} laporan`,
        fontSize:  9,
        color:     "#666",
        alignment: "center",
        margin:    [0, 0, 0, 16],
      },
      reports.length === 0
        ? { text: "Tidak ada laporan yang sesuai filter.", color: "#999", italics: true }
        : {
            table: {
              headerRows:    1,
              dontBreakRows: false,
              widths:        ["20%", "15%", "25%", "40%"],
              body: [
                [
                  { text: "Role / Karyawan", style: "tableHeader" },
                  { text: "Durasi Kerja",    style: "tableHeader" },
                  { text: "Bukti/Setelah",   style: "tableHeader" },
                  { text: "Deskripsi",       style: "tableHeader" },
                ],
                ...rows,
              ],
            },
            layout: {
              hLineWidth:    () => 0.5,
              vLineWidth:    () => 0.5,
              hLineColor:    () => "#ccc",
              vLineColor:    () => "#ccc",
              paddingTop:    () => 8,
              paddingBottom: () => 8,
              paddingLeft:   () => 8,
              paddingRight:  () => 8,
              fillColor: (rowIndex: number) =>
                rowIndex === 0 ? "#111" : rowIndex % 2 === 0 ? "#FAFAFA" : null,
            },
          },
    ],

    styles: {
      title: {
        fontSize: 16,
        bold:     true,
        font:     "Arial",
      },
      tableHeader: {
        color:     "#FFD700",
        bold:      true,
        fontSize:  9,
        fillColor: "#111",
      },
    },

    defaultStyle: {
      font:     "Arial",
      fontSize: 10,
    },
  };

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const printer = getPrinter();
      const pdfDoc  = printer.createPdfKitDocument(docDefinition);

      const chunks: Buffer[] = [];
      pdfDoc.on("data",  (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end",   () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", reject);
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}
