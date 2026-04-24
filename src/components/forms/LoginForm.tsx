"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginSchema, type LoginInput } from "@/lib/validations";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Email atau password salah. Silakan coba lagi.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <form
      id="login-form"
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

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="email@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button
        id="btn-login-submit"
        type="submit"
        variant="primary"
        size="lg"
        loading={isSubmitting}
        style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
      >
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>

      <p style={{ textAlign: "center", fontSize: "0.9rem", fontWeight: 500 }}>
        Belum punya akun?{" "}
        <Link
          href="/register"
          style={{ fontWeight: 700, textDecoration: "underline", color: "#000" }}
        >
          Daftar sekarang
        </Link>
      </p>
    </form>
  );
}
