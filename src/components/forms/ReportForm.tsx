"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReportBaseSchema } from "@/lib/validations";
import type { z } from "zod";
import { createReport } from "@/actions/report.actions";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Send } from "lucide-react";

type FormValues = z.infer<typeof createReportBaseSchema>;

export default function ReportForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<{ before?: string; after?: string }>({});
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FormValues | null>(null);

  const beforeFileRef = useRef<File | null>(null);
  const afterFileRef = useRef<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(createReportBaseSchema),
  });

  const onPreSubmit = (data: FormValues) => {
    setServerError(null);
    setFileErrors({});

    const before = beforeFileRef.current;
    const after = afterFileRef.current;

    // Client-side file presence check
    const ferr: { before?: string; after?: string } = {};
    if (!before) ferr.before = "Foto sebelum wajib diunggah";
    if (!after) ferr.after = "Foto sesudah wajib diunggah";
    if (ferr.before || ferr.after) {
      setFileErrors(ferr);
      return;
    }

    setPendingData(data);
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    if (!pendingData) return;
    
    const before = beforeFileRef.current;
    const after = afterFileRef.current;

    const formData = new FormData();
    formData.set("description", pendingData.description);
    formData.set("work_start", pendingData.work_start);
    formData.set("work_end", pendingData.work_end);
    formData.set("before_image", before!);
    formData.set("after_image", after!);

    startTransition(async () => {
      const result = await createReport(formData);
      if (result.sukses && result.data) {
        setShowConfirm(false);
        router.push(`/reports/${result.data.id}`);
      } else {
        // Map field-level errors from server
        if (result.kesalahan) {
          result.kesalahan.forEach((err) => {
            if (err.kolom === "before_image") {
              setFileErrors((prev) => ({ ...prev, before: err.pesan }));
            } else if (err.kolom === "after_image") {
              setFileErrors((prev) => ({ ...prev, after: err.pesan }));
            } else if (err.kolom in pendingData) {
              setError(err.kolom as keyof FormValues, { message: err.pesan });
            }
          });
        }
        setServerError(result.pesan);
        setShowConfirm(false);
      }
    });
  };

  return (
    <>
      <form
        id="form-buat-laporan"
        onSubmit={(e) => handleSubmit(onPreSubmit)(e)}
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

        {/* Time fields */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <Input
            id="work_start"
            label="Waktu Mulai"
            type="datetime-local"
            error={errors.work_start?.message}
            {...register("work_start")}
          />
          <Input
            id="work_end"
            label="Waktu Selesai"
            type="datetime-local"
            error={errors.work_end?.message}
            {...register("work_end")}
          />
        </div>

        {/* Description */}
        <Textarea
          id="description"
          label="Deskripsi Pekerjaan"
          placeholder="Tuliskan deskripsi pekerjaan yang dilakukan (minimal 10 karakter)"
          rows={5}
          error={errors.description?.message}
          {...register("description")}
        />

        {/* File uploads */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <FileUpload
            id="before_image"
            name="before_image"
            label="Foto Sebelum Kerja"
            error={fileErrors.before}
            onChange={(file) => {
              beforeFileRef.current = file;
              if (file) setFileErrors((prev) => ({ ...prev, before: undefined }));
            }}
          />
          <FileUpload
            id="after_image"
            name="after_image"
            label="Foto Sesudah Kerja"
            error={fileErrors.after}
            onChange={(file) => {
              afterFileRef.current = file;
              if (file) setFileErrors((prev) => ({ ...prev, after: undefined }));
            }}
          />
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
            id="btn-batal-buat"
          >
            Batal
          </button>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            id="btn-submit-laporan"
          >
            <Send size={18} strokeWidth={2.5} style={{ marginRight: '8px' }} /> Kirim Laporan
          </Button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showConfirm}
        title="KIRIM LAPORAN SEKARANG?"
        description="Pastikan data yang diisi dan gambar yang dilampirkan sudah benar."
        confirmLabel="Ya, Kirim Laporan"
        cancelLabel="Cek Kembali"
        variant="primary"
        loading={isPending}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />
    </>
  );
}
