"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, PenTool, BarChart2, Users, KeyRound } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",       label: "Home",       icon: <Home strokeWidth={2.5} size={22} />, permission: null },
  { href: "/reports/new",     label: "Laporan",    icon: <PenTool strokeWidth={2.5} size={22} />, permission: null },
  { href: "/admin/reports",   label: "Admin",      icon: <BarChart2 strokeWidth={2.5} size={22} />, permission: "manage_users" },
  { href: "/admin/users",     label: "Users",      icon: <Users strokeWidth={2.5} size={22} />, permission: "manage_users" },
  { href: "/admin/roles",     label: "Roles",      icon: <KeyRound strokeWidth={2.5} size={22} />, permission: "manage_roles" },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const permissions: string[] = session?.user?.permissions ?? [];

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || permissions.includes(item.permission)
  );

  return (
    <nav 
      className="md:hidden flex justify-around items-center pb-safe"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--color-surface)",
        borderTop: "3px solid #000",
        zIndex: 50,
        height: "70px",
      }}
    >
      {visibleItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
            
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              gap: "0.25rem",
              transition: "color 150ms",
              color: isActive ? "var(--color-primary)" : "var(--color-muted)",
              backgroundColor: isActive ? "#000" : "transparent",
            }}
          >
            {item.icon}
            <span style={{ fontSize: "10px", fontWeight: "bold" }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
