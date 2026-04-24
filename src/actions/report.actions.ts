"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromMinIO, uploadToMinIO } from "@/lib/minio";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { createReportBaseSchema, updateReportSchema } from "@/lib/validations";
import type { ActionResult } from "@/types";
import { v4 as uuid } from "uuid";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES[file.type]) {
    return "Format file tidak didukung, gunakan JPG/PNG/WebP";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Ukuran file melebihi batas maksimum 5MB";
  }
  return null;
}

/** Generate object key — TIDAK menggunakan nama file asli (anti path traversal) */
function generateKey(userId: string, mimeType: string): string {
  const ext = ALLOWED_TYPES[mimeType] ?? "jpg";
  return `reports/${userId}/${uuid()}.${ext}`;
}

async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// createReport — atomic upload ke MinIO + INSERT ke DB
// Jika DB gagal → semua file yang sudah terupload dihapus (anti orphan)
// ---------------------------------------------------------------------------

export async function createReport(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session) {
    return { sukses: false, pesan: "Sesi Anda telah berakhir, silakan login kembali" };
  }
  if (!hasPermission(session.user.permissions, PERMISSIONS.CREATE_REPORT)) {
    return { sukses: false, pesan: "Anda tidak memiliki akses untuk melakukan tindakan ini" };
  }

  // 1. Ambil dan validasi file
  const beforeEntry = formData.get("before_image");
  const afterEntry = formData.get("after_image");

  const beforeFile = beforeEntry instanceof File ? beforeEntry : null;
  const afterFile = afterEntry instanceof File ? afterEntry : null;

  if (!beforeFile || beforeFile.size === 0) {
    return {
      sukses: false, pesan: "Data yang dikirim tidak valid",
      kesalahan: [{ kolom: "before_image", pesan: "Foto sebelum wajib diunggah" }],
    };
  }
  if (!afterFile || afterFile.size === 0) {
    return {
      sukses: false, pesan: "Data yang dikirim tidak valid",
      kesalahan: [{ kolom: "after_image", pesan: "Foto sesudah wajib diunggah" }],
    };
  }

  const beforeErr = validateFile(beforeFile);
  if (beforeErr) {
    return { sukses: false, pesan: beforeErr, kesalahan: [{ kolom: "before_image", pesan: beforeErr }] };
  }
  const afterErr = validateFile(afterFile);
  if (afterErr) {
    return { sukses: false, pesan: afterErr, kesalahan: [{ kolom: "after_image", pesan: afterErr }] };
  }

  // 2. Validasi data laporan
  const raw = {
    description: formData.get("description"),
    work_start:  formData.get("work_start"),
    work_end:    formData.get("work_end"),
  };
  const parsed = createReportBaseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: parsed.error.errors.map((e) => ({
        kolom: String(e.path[0] ?? ""),
        pesan: e.message,
      })),
    };
  }

  // Validate work_end > work_start
  if (new Date(parsed.data.work_end) <= new Date(parsed.data.work_start)) {
    return {
      sukses: false, pesan: "Data yang dikirim tidak valid",
      kesalahan: [{ kolom: "work_end", pesan: "Waktu selesai harus lebih besar dari waktu mulai" }],
    };
  }

  // 3. Atomic upload — track uploadedKeys for rollback
  const uploadedKeys: string[] = [];

  try {
    const beforeKey = generateKey(session.user.id, beforeFile.type);
    const afterKey  = generateKey(session.user.id, afterFile.type);

    const [beforeBuffer, afterBuffer] = await Promise.all([
      fileToBuffer(beforeFile),
      fileToBuffer(afterFile),
    ]);

    await uploadToMinIO(beforeKey, beforeBuffer, beforeFile.type);
    uploadedKeys.push(beforeKey);

    await uploadToMinIO(afterKey, afterBuffer, afterFile.type);
    uploadedKeys.push(afterKey);

    // 4. INSERT ke DB — jika this throws, catch block hapus file MinIO
    const report = await prisma.report.create({
      data: {
        user_id:          session.user.id,
        before_image_key: beforeKey,
        after_image_key:  afterKey,
        description:      parsed.data.description,
        work_start:       new Date(parsed.data.work_start),
        work_end:         new Date(parsed.data.work_end),
        status:           "pending",
      },
      select: { id: true },
    });

    revalidatePath("/dashboard");
    return { sukses: true, pesan: "Laporan berhasil dibuat", data: report };
  } catch (error: unknown) {
    console.error("[createReport]", error);

    // Rollback: hapus semua file yang sudah terupload
    await Promise.allSettled(uploadedKeys.map((key) => deleteFromMinIO(key)));

    return {
      sukses: false,
      pesan: "Terjadi kesalahan pada server, silakan hubungi administrator",
    };
  }
}

// ---------------------------------------------------------------------------
// updateReport — update teks + opsional ganti gambar
// Hanya bisa pada laporan milik sendiri yang masih PENDING
// ---------------------------------------------------------------------------

export async function updateReport(
  reportId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session) {
    return { sukses: false, pesan: "Sesi Anda telah berakhir, silakan login kembali" };
  }

  // Fetch laporan — verifikasi ownership + status
  const report = await prisma.report.findFirst({
    where: { id: reportId, deleted_at: null },
    select: {
      id: true,
      user_id: true,
      status: true,
      before_image_key: true,
      after_image_key: true,
    },
  });

  if (!report) {
    return { sukses: false, pesan: "Data tidak ditemukan" };
  }
  if (report.user_id !== session.user.id) {
    return { sukses: false, pesan: "Anda tidak memiliki akses untuk melakukan tindakan ini" };
  }
  if (report.status !== "pending") {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: [{ kolom: "status", pesan: "Laporan hanya dapat diedit saat status masih menunggu" }],
    };
  }

  // Validate text fields
  const raw = {
    description: formData.get("description") ?? undefined,
    work_start:  formData.get("work_start")  ?? undefined,
    work_end:    formData.get("work_end")     ?? undefined,
  };
  const parsed = updateReportSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: "Data yang dikirim tidak valid",
      kesalahan: parsed.error.errors.map((e) => ({
        kolom: String(e.path[0] ?? ""),
        pesan: e.message,
      })),
    };
  }

  // Optional image replacement
  const beforeEntry = formData.get("before_image");
  const afterEntry = formData.get("after_image");
  
  const beforeFile = beforeEntry instanceof File ? beforeEntry : null;
  const afterFile = afterEntry instanceof File ? afterEntry : null;

  const uploadedKeys: string[] = [];
  let newBeforeKey: string | undefined;
  let newAfterKey:  string | undefined;
  const oldKeys: string[] = [];

  try {
    if (beforeFile && beforeFile.size > 0) {
      const err = validateFile(beforeFile);
      if (err) return { sukses: false, pesan: err, kesalahan: [{ kolom: "before_image", pesan: err }] };
      newBeforeKey = generateKey(session.user.id, beforeFile.type);
      await uploadToMinIO(newBeforeKey, await fileToBuffer(beforeFile), beforeFile.type);
      uploadedKeys.push(newBeforeKey);
      oldKeys.push(report.before_image_key);
    }

    if (afterFile && afterFile.size > 0) {
      const err = validateFile(afterFile);
      if (err) {
        // Rollback before upload
        await Promise.allSettled(uploadedKeys.map((k) => deleteFromMinIO(k)));
        return { sukses: false, pesan: err, kesalahan: [{ kolom: "after_image", pesan: err }] };
      }
      newAfterKey = generateKey(session.user.id, afterFile.type);
      await uploadToMinIO(newAfterKey, await fileToBuffer(afterFile), afterFile.type);
      uploadedKeys.push(newAfterKey);
      oldKeys.push(report.after_image_key);
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...(parsed.data.description && { description: parsed.data.description }),
        ...(parsed.data.work_start  && { work_start: new Date(parsed.data.work_start) }),
        ...(parsed.data.work_end    && { work_end:   new Date(parsed.data.work_end) }),
        ...(newBeforeKey && { before_image_key: newBeforeKey }),
        ...(newAfterKey  && { after_image_key:  newAfterKey }),
      },
      select: { id: true },
    });

    // Delete old images only after DB success
    await Promise.allSettled(oldKeys.map((k) => deleteFromMinIO(k)));

    revalidatePath(`/reports/${reportId}`);
    revalidatePath("/dashboard");
    return { sukses: true, pesan: "Laporan berhasil diperbarui", data: updated };
  } catch (error: unknown) {
    console.error("[updateReport]", error);
    await Promise.allSettled(uploadedKeys.map((k) => deleteFromMinIO(k)));
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}

// ---------------------------------------------------------------------------
// deleteReport — soft delete + hapus file MinIO
// Hanya bisa pada laporan milik sendiri yang masih PENDING
// ---------------------------------------------------------------------------

export async function deleteReport(reportId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) {
    return { sukses: false, pesan: "Sesi Anda telah berakhir, silakan login kembali" };
  }

  const report = await prisma.report.findFirst({
    where: { id: reportId, deleted_at: null },
    select: {
      id: true,
      user_id: true,
      status: true,
      before_image_key: true,
      after_image_key: true,
    },
  });

  if (!report) {
    return { sukses: false, pesan: "Data tidak ditemukan" };
  }

  // Admin dapat hapus laporan apapun, user biasa hanya milik sendiri
  const isAdmin = hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS);
  if (!isAdmin && report.user_id !== session.user.id) {
    return { sukses: false, pesan: "Anda tidak memiliki akses untuk melakukan tindakan ini" };
  }

  try {
    // Soft delete dulu — file MinIO dihapus setelah DB berhasil
    await prisma.report.update({
      where: { id: reportId },
      data: { deleted_at: new Date() },
    });

    // Hapus file dari MinIO (fire and settle — jangan crash jika gagal)
    await Promise.allSettled([
      deleteFromMinIO(report.before_image_key),
      deleteFromMinIO(report.after_image_key),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/admin/reports");
    return { sukses: true, pesan: "Laporan berhasil dihapus" };
  } catch (error: unknown) {
    console.error("[deleteReport]", error);
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}
