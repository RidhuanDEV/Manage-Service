"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateReportSchema } from "@/lib/validations";
import type { z } from "zod";
import { updateReport } from "@/actions/report.actions";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";

type FormValues = z.infer<typeof updateReportSchema>;

interface ReportEditFormProps {
  reportId: string;
  defaultValues: {
    description: string;
    work_start: string; // ISO string
    work_end: string;   // ISO string
  };
}

// Convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ReportEditForm({ reportId, defaultValues }: ReportEditFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<{ before?: string; after?: string }>({});
  const [isPending, startTransition] = useTransition();

  const beforeFileRef = useRef<File | null>(null);
  const afterFileRef = useRef<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(updateReportSchema),
    defaultValues: {
      description: defaultValues.description,
      work_start: toDatetimeLocal(defaultValues.work_start),
      work_end: toDatetimeLocal(defaultValues.work_end),
    },
  });

  const onSubmit = (data: FormValues) => {
    setServerError(null);
    setSuccessMsg(null);
    setFileErrors({});

    const formData = new FormData();
    if (data.description) formData.set("description", data.description);
    if (data.work_start)  formData.set("work_start", new Date(data.work_start).toISOString());
    if (data.work_end)    formData.set("work_end",   new Date(data.work_end).toISOString());
    if (beforeFileRef.current) formData.set("before_image", beforeFileRef.current);
    if (afterFileRef.current)  formData.set("after_image",  afterFileRef.current);

    startTransition(async () => {
      const result = await updateReport(reportId, formData);
      if (result.sukses && result.data) {
        setSuccessMsg("Laporan berhasil diperbarui!");
        setTimeout(() => router.push(`/reports/${result.data!.id}`), 1200);
      } else {
        if (result.kesalahan) {
          result.kesalahan.forEach((err) => {
            if (err.kolom === "before_image") {
              setFileErrors((prev) => ({ ...prev, before: err.pesan }));
            } else if (err.kolom === "after_image") {
              setFileErrors((prev) => ({ ...prev, after: err.pesan }));
            } else {
              setError(err.kolom as keyof FormValues, { message: err.pesan });
            }
          });
        }
        setServerError(result.pesan);
      }
    });
  };

  return (
    <form
      id="form-edit-laporan"
      onSubmit={(e) => handleSubmit(onSubmit)(e)}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
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

      {successMsg && (
        <div
          style={{
            background: "rgba(0,200,81,0.1)",
            border: "2px solid var(--color-success)",
            padding: "0.875rem 1rem",
            fontWeight: 600,
            color: "var(--color-success)",
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {/* Time fields */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <Input
          id="edit_work_start"
          label="Waktu Mulai"
          type="datetime-local"
          error={errors.work_start?.message}
          {...register("work_start")}
        />
        <Input
          id="edit_work_end"
          label="Waktu Selesai"
          type="datetime-local"
          error={errors.work_end?.message}
          {...register("work_end")}
        />
      </div>

      {/* Description */}
      <Textarea
        id="edit_description"
        label="Deskripsi Pekerjaan"
        rows={5}
        error={errors.description?.message}
        {...register("description")}
      />

      {/* Optional image replacement */}
      <div>
        <p
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.875rem",
          }}
        >
          Ganti Foto (Opsional)
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <FileUpload
            id="edit_before_image"
            name="before_image"
            label="Foto Sebelum (biarkan kosong jika tidak diganti)"
            error={fileErrors.before}
            onChange={(file) => {
              beforeFileRef.current = file;
              if (file) setFileErrors((prev) => ({ ...prev, before: undefined }));
            }}
          />
          <FileUpload
            id="edit_after_image"
            name="after_image"
            label="Foto Sesudah (biarkan kosong jika tidak diganti)"
            error={fileErrors.after}
            onChange={(file) => {
              afterFileRef.current = file;
              if (file) setFileErrors((prev) => ({ ...prev, after: undefined }));
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          justifyContent: "flex-end",
          paddingTop: "0.5rem",
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.back()}
          disabled={isPending}
          id="btn-batal-edit"
        >
          Batal
        </button>
        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          id="btn-simpan-laporan"
        >
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}
