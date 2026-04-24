"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useUIStore } from "@/store/uiStore";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Home, PenTool, BarChart2, Users, KeyRound, LogOut, FileText } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",       label: "Dashboard",       icon: <Home strokeWidth={2.5} size={20} />, permission: null },
  { href: "/reports/new",     label: "Buat Laporan",    icon: <PenTool strokeWidth={2.5} size={20} />, permission: null },
  { href: "/admin/reports",   label: "Admin Laporan",   icon: <BarChart2 strokeWidth={2.5} size={20} />, permission: "manage_users" },
  { href: "/admin/users",     label: "Kelola User",     icon: <Users strokeWidth={2.5} size={20} />, permission: "manage_users" },
  { href: "/admin/roles",     label: "Kelola Role",     icon: <KeyRound strokeWidth={2.5} size={20} />, permission: "manage_roles" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { data: session } = useSession();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const permissions: string[] = session?.user?.permissions ?? [];

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || permissions.includes(item.permission)
  );

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isSidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
            display: "none", // shown via CSS on mobile
          }}
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`sidebar fixed md:sticky top-0 left-0 h-screen flex flex-col transition-all duration-200 ease-in-out z-50 overflow-hidden bg-[var(--color-dark)] ${
          isSidebarOpen ? "translate-x-0 w-[260px]" : "-translate-x-full md:translate-x-0 w-[64px]"
        }`}
        aria-label="Menu navigasi"
      >
        {/* Logo */}
        <div
          style={{
            padding: "1.25rem",
            borderBottom: "2px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            minHeight: "4rem",
          }}
        >
          <div style={{ flexShrink: 0, background: "var(--color-primary)", color: "#000", padding: "4px", border: "2px solid #000", boxShadow: "2px 2px 0px #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText strokeWidth={3} size={24} />
          </div>
          {isSidebarOpen && (
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1rem", color: "var(--color-primary)", lineHeight: 1 }}>
                Manage
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1rem", color: "#fff", lineHeight: 1 }}>
                Service
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0.75rem 0", overflowY: "auto" }}>
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {item.icon}
                </span>
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ borderTop: "2px solid rgba(255,255,255,0.15)", padding: "1rem" }}>
          {isSidebarOpen && session && (
            <div style={{ marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.user?.name}
              </p>
              <span style={{ marginTop: "0.25rem", fontSize: "0.7rem", display: "inline-block" }}>
                <Badge variant="admin">
                  {session.user?.role?.label ?? session.user?.role?.name}
                </Badge>
              </span>
            </div>
          )}
          <button
            id="btn-logout"
            onClick={() => setIsLogoutModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "transparent",
              border: "2px solid rgba(255,59,59,0.5)",
              color: "rgba(255,100,100,0.9)",
              padding: "0.5rem 0.75rem",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.875rem",
              width: "100%",
              transition: "background 80ms, transform 80ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,59,59,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translate(2px, 2px)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "none")}
            aria-label="Keluar"
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogOut strokeWidth={2.5} size={18} />
            </span>
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

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
