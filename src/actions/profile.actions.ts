"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { sukses: false, pesan: "Sesi Anda telah berakhir, silakan login kembali" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateProfileSchema.safeParse(raw);
  
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

  const data: UpdateProfileInput = parsed.data;
  
  // Data to update
  const updateData: Prisma.UserUpdateInput = {};
  
  if (data.name && data.name.trim() !== "") {
    updateData.name = data.name.trim();
  }
  
  if (data.email && data.email.trim() !== "") {
    const emailToUpdate = data.email.trim();
    
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: emailToUpdate, 
        id: { not: session.user.id } 
      },
    });
    
    if (existingUser) {
      return {
        sukses: false,
        pesan: "Data yang dikirim tidak valid",
        kesalahan: [{ kolom: "email", pesan: "Email sudah digunakan oleh akun lain" }]
      };
    }
    updateData.email = emailToUpdate;
  }
  
  if (data.password && data.password.trim() !== "") {
    const salt = await bcrypt.genSalt(12);
    updateData.password = await bcrypt.hash(data.password, salt);
  }

  if (Object.keys(updateData).length === 0) {
    return { sukses: false, pesan: "Tidak ada data yang diubah" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
    
    revalidatePath("/profile");
    return { sukses: true, pesan: "Profil berhasil diperbarui" };
  } catch (error: unknown) {
    console.error("[updateProfile]", error);
    return { sukses: false, pesan: "Terjadi kesalahan pada server, silakan hubungi administrator" };
  }
}

