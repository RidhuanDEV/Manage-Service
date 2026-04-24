"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "dark" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:   "btn btn-primary",
  secondary: "btn btn-secondary",
  danger:    "btn btn-danger",
  success:   "btn btn-success",
  dark:      "btn btn-dark",
  ghost:     "btn btn-ghost",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
