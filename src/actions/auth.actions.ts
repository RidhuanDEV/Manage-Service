"use server";

import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import type { ActionResult } from "@/types";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Register — buat user baru
// ---------------------------------------------------------------------------
export async function registerUser(
  input: RegisterInput
): Promise<ActionResult<{ id: string; email: string }>> {
  // 1. Validate input
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const kesalahan = parsed.error.errors.map((e) => ({
      kolom: String(e.path[0] ?? ""),
      pesan: e.message,
    }));
    return { sukses: false, pesan: "Data yang dikirim tidak valid", kesalahan };
  }

  const { name, email, password, role_id } = parsed.data;

  try {
    // 2. Cek email sudah terdaftar
    const existing = await prisma.user.findFirst({
      where: { email, deleted_at: null },
      select: { id: true },
    });
    if (existing) {
      return {
        sukses: false,
        pesan: "Data sudah terdaftar",
        kesalahan: [{ kolom: "email", pesan: "Email sudah terdaftar" }],
      };
    }

    // 3. Verifikasi role exists + active
    const role = await prisma.role.findFirst({
      where: { id: role_id, is_active: true },
      select: { id: true, name: true },
    });
    if (!role) {
      return {
        sukses: false,
        pesan: "Data yang dikirim tidak valid",
        kesalahan: [{ kolom: "role_id", pesan: "Role tidak ditemukan atau tidak aktif" }],
      };
    }

    // Prevent self-assigning ADMIN role via register
    if (role.name === "ADMIN") {
      return {
        sukses: false,
        pesan: "Anda tidak memiliki akses untuk melakukan tindakan ini",
        kesalahan: [{ kolom: "role_id", pesan: "Role ADMIN tidak dapat dipilih saat registrasi" }],
      };
    }

    // 4. Hash password
    const hashed = await bcrypt.hash(password, 12);

    // 5. Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role_id },
      select: { id: true, email: true },
    });

    return { sukses: true, pesan: "Data berhasil dibuat", data: user };
  } catch (error: unknown) {
    console.error("[registerUser]", error);
    return {
      sukses: false,
      pesan: "Terjadi kesalahan pada server, silakan hubungi administrator",
    };
  }
}

