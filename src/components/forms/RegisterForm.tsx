"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerUser } from "@/actions/auth.actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { registerSchema, type RegisterInput } from "@/lib/validations";

interface Role {
  id: string;
  name: string;
  label: string;
}

interface RegisterFormProps {
  roles: Role[];
}

export function RegisterForm({ roles }: RegisterFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role_id: "" },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    setSuccessMsg(null);

    const result = await registerUser(data);

    if (!result.sukses) {
      // Map field errors back to react-hook-form
      result.kesalahan?.forEach((e) => {
        if (e.kolom && e.kolom in data) {
          setError(e.kolom as keyof RegisterInput, { message: e.pesan });
        }
      });
      if (!result.kesalahan?.length) {
        setServerError(result.pesan);
      }
      return;
    }

    setSuccessMsg("Akun berhasil dibuat! Mengalihkan ke halaman login...");
    setTimeout(() => router.push("/login"), 2000);
  };

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.label }));

  return (
    <form
      id="register-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      {serverError && (
        <div
          role="alert"
          style={{
            background: "rgba(255,59,59,0.1)",
            border: "2px solid var(--color-danger)",
            padding: "0.75rem 1rem",
            fontWeight: 600,
            fontSize: "0.9rem",
            color: "var(--color-danger)",
          }}
        >
          {serverError}
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          style={{
            background: "rgba(0,200,81,0.1)",
            border: "2px solid var(--color-success)",
            padding: "0.75rem 1rem",
            fontWeight: 600,
            fontSize: "0.9rem",
            color: "#005c24",
          }}
        >
          {successMsg}
        </div>
      )}

      <Input
        label="Nama Lengkap"
        type="text"
        autoComplete="name"
        placeholder="Nama Lengkap"
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="email@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Select
        label="Role / Jabatan"
        placeholder="-- Pilih Role --"
        options={roleOptions}
        error={errors.role_id?.message}
        {...register("role_id")}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="Min. 8 karakter, 1 kapital, 1 angka, 1 simbol"
        error={errors.password?.message}
        hint="Contoh: Passw0rd!"
        {...register("password")}
      />

      <Input
        label="Konfirmasi Password"
        type="password"
        autoComplete="new-password"
        placeholder="Ulangi password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button
        id="btn-register-submit"
        type="submit"
        variant="primary"
        size="lg"
        loading={isSubmitting}
        style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
      >
        {isSubmitting ? "Mendaftarkan..." : "Daftar"}
      </Button>

      <p style={{ textAlign: "center", fontSize: "0.9rem", fontWeight: 500 }}>
        Sudah punya akun?{" "}
        <Link
          href="/login"
          style={{ fontWeight: 700, textDecoration: "underline", color: "#000" }}
        >
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
