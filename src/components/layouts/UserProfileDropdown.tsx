"use client";

import React, { useState } from "react";
import { NeoDropdown, DropdownItem } from "@/components/ui/NeoDropdown";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserProfileProps {
  user: {
    name?: string | null;
    role?: { label?: string; name?: string } | null;
  };
}

export function UserProfileDropdown({ user }: UserProfileProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const router = useRouter();

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

  const dropdownLabel = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div className="hidden md:block text-right">
        <p style={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2, margin: 0 }}>
          {user?.name}
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", fontWeight: 500, margin: 0 }}>
          {user?.role?.label ?? user?.role?.name}
        </p>
      </div>
      <div
        style={{
          width: "32px",
          height: "32px",
          background: "var(--color-primary)",
          border: "2px solid #000",
          boxShadow: "2px 2px 0 #000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: "1rem",
          color: "#000",
        }}
        aria-hidden="true"
      >
        {initial}
      </div>
    </div>
  );

  const items: DropdownItem[] = [
    {
      key: "profile",
      label: "Profil Saya",
      icon: <User size={18} strokeWidth={2.5} />,
      onClick: () => {
        router.push("/profile");
      },
    },
    {
      key: "logout",
      label: "Keluar",
      icon: <LogOut size={18} strokeWidth={2.5} />,
      danger: true,
      onClick: () => setIsLogoutModalOpen(true),
    },
  ];

  return (
    <>
      <NeoDropdown label={dropdownLabel} items={items} />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="YAKIN INGIN KELUAR?"
        description="Anda akan keluar dari sesi saat ini dan harus login kembali untuk mengakses aplikasi."
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        variant="danger"
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
