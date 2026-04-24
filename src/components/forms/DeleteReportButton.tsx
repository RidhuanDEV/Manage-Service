"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReport } from "@/actions/report.actions";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Trash2 } from "lucide-react";

interface Props {
  reportId: string;
}

export default function DeleteReportButton({ reportId }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteReport(reportId);
      if (result.sukses) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(result.pesan);
        setShowConfirm(false);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="danger"
        id="btn-hapus-laporan"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
      >
        <Trash2 size={18} strokeWidth={2.5} /> Hapus
      </Button>

      {error && (
        <p
          style={{
            color: "var(--color-danger)",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          {error}
        </p>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        title="YAKIN HAPUS LAPORAN?"
        description="Laporan yang dihapus tidak dapat dipulihkan. Apakah Anda yakin ingin melanjutkan?"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        loading={isPending}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
