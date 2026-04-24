"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations";
import { updateProfile } from "@/actions/profile.actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
    role: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    if (data.name) formData.set("name", data.name);
    if (data.email) formData.set("email", data.email);
    if (data.password) formData.set("password", data.password);
    if (data.confirmPassword) formData.set("confirmPassword", data.confirmPassword);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.sukses) {
        setSuccessMessage(result.pesan);
        // Reset password fields
        reset((formValues) => ({
          ...formValues,
          password: "",
          confirmPassword: "",
        }));
      } else {
        if (result.kesalahan) {
          result.kesalahan.forEach((err) => {
            setError(err.kolom as keyof UpdateProfileInput, { message: err.pesan });
          });
        }
        setServerError(result.pesan);
      }
    });
  };

  return (
    <div style={{ maxWidth: "600px", width: "100%", margin: "0 auto" }}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          background: "var(--color-surface)",
          border: "3px solid #000",
          boxShadow: "6px 6px 0px #000",
          padding: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "var(--color-primary)",
              border: "2px solid #000",
              boxShadow: "2px 2px 0 #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "2rem",
            }}
          >
            {initialData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.5rem", margin: 0 }}>
              Profil Saya
            </h2>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--color-muted)" }}>
              Role: <span style={{ color: "var(--color-dark)" }}>{initialData.role}</span>
            </p>
          </div>
        </div>

        {serverError && (
          <div
            style={{
              background: "#FFF0F0",
              border: "2px solid var(--color-danger)",
              padding: "0.875rem 1rem",
              fontWeight: 600,
              color: "var(--color-danger)",
            }}
          >
            {serverError}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: "#F0FFF4",
              border: "2px solid var(--color-success, #00C851)",
              padding: "0.875rem 1rem",
              fontWeight: 600,
              color: "var(--color-success, #00C851)",
            }}
          >
            ✅ {successMessage}
          </div>
        )}

        <Input
          id="name"
          label="Nama Lengkap"
          placeholder="Masukkan nama lengkap"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          id="email"
          type="email"
          label="Alamat Email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div style={{ borderTop: "2px dashed #000", margin: "0.5rem 0" }} />
        
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--color-muted)" }}>
          Kosongkan password jika tidak ingin mengubahnya.
        </p>

        <Input
          id="password"
          type="password"
          label="Password Baru"
          placeholder="Minimal 8 karakter"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          id="confirmPassword"
          type="password"
          label="Konfirmasi Password Baru"
          placeholder="Ketik ulang password baru"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <Button type="submit" variant="primary" loading={isPending}>
            <Save size={18} strokeWidth={2.5} style={{ marginRight: '8px' }} /> Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
