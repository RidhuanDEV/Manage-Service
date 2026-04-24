"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";

interface FileUploadProps {
  label?: string;
  name: string;
  accept?: string;
  maxSizeMB?: number;
  error?: string;
  onChange?: (file: File | null) => void;
  id?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function FileUpload({
  label,
  name,
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMB = 5,
  error,
  onChange,
  id,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stable validate function — only recreated when maxSizeMB changes
  const validate = useMemo(
    () =>
      (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          return "Format file tidak didukung, gunakan JPG/PNG/WebP";
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          return `Ukuran file melebihi batas maksimum ${maxSizeMB}MB`;
        }
        return null;
      },
    [maxSizeMB]
  );

  const handleFile = useCallback(
    (file: File | null) => {
      setFileError(null);
      if (!file) {
        setPreview(null);
        onChange?.(null);
        return;
      }
      const err = validate(file);
      if (err) {
        setFileError(err);
        setPreview(null);
        onChange?.(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange?.(file);
    },
    [onChange, validate]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const displayError = fileError ?? error;

  return (
    <div className="form-group">
      {label && <span className="label">{label}</span>}

      <div
        className={`dropzone ${isDragging ? "active" : ""} ${displayError ? "input-error" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        aria-label={`Upload ${label ?? "file"}`}
      >
        <input
          ref={inputRef}
          type="file"
          id={id ?? name}
          name={name}
          accept={accept}
          className="sr-only"
          onChange={onInputChange}
        />

        {preview ? (
          <div style={{ position: "relative" }}>
            {/*
              unoptimized is required here because `preview` is a blob: URL
              (from URL.createObjectURL) — Next.js Image optimization only works
              with remote URLs from allowed domains or static imports.
            */}
            <Image
              src={preview}
              alt="Preview foto yang dipilih"
              unoptimized
              width={0}
              height={0}
              sizes="100vw"
              style={{
                maxHeight: "180px",
                maxWidth: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                border: "2px solid #000",
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                if (inputRef.current) inputRef.current.value = "";
                onChange?.(null);
              }}
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                background: "var(--color-danger)",
                color: "#fff",
                border: "2px solid #000",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.875rem",
              }}
              aria-label="Hapus gambar"
            >
              ×
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
              📁 Klik atau seret file ke sini
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
              JPG, PNG, WebP — maks. {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {displayError && <p className="field-error">{displayError}</p>}
    </div>
  );
}
