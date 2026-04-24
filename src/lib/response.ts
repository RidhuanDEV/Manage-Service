import type { PaginationMeta } from "@/types";

// ---------------------------------------------------------------------------
// Route Handler helpers — return Response.json
// ---------------------------------------------------------------------------
export function berhasil(data: unknown, pesan = "Data berhasil dimuat", status = 200) {
  return Response.json({ sukses: true, pesan, data }, { status });
}

export function berhasilDibuat(data: unknown, pesan = "Data berhasil dibuat") {
  return Response.json({ sukses: true, pesan, data }, { status: 201 });
}

export function berhasilPaginated(
  data: unknown,
  meta: PaginationMeta,
  pesan = "Data berhasil dimuat"
) {
  return Response.json({ sukses: true, pesan, data, meta });
}

export function gagal(pesan: string, status = 400, kesalahan?: unknown) {
  return Response.json(
    { sukses: false, pesan, kesalahan: kesalahan ?? null },
    { status }
  );
}

// ---------------------------------------------------------------------------
// HTTP Status pesan default (Bahasa Indonesia)
// ---------------------------------------------------------------------------
export const PESAN_HTTP = {
  200: "Data berhasil dimuat",
  201: "Data berhasil dibuat",
  400: "Data yang dikirim tidak valid",
  401: "Sesi Anda telah berakhir, silakan login kembali",
  403: "Anda tidak memiliki akses untuk melakukan tindakan ini",
  404: "Data tidak ditemukan",
  409: "Data sudah terdaftar",
  413: "Ukuran file melebihi batas maksimum 5MB",
  415: "Format file tidak didukung, gunakan JPG/PNG/WebP",
  429: "Terlalu banyak permintaan, coba lagi dalam beberapa saat",
  500: "Terjadi kesalahan pada server, silakan hubungi administrator",
} as const;
