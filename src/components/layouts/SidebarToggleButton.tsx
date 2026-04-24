"use client";

import { useUIStore } from "@/store/uiStore";

export function SidebarToggleButton() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <button
      id="btn-sidebar-toggle"
      aria-label="Toggle sidebar"
      onClick={toggleSidebar}
      style={{
        background: "none",
        border: "2px solid #000",
        width: "36px",
        height: "36px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        cursor: "pointer",
        flexShrink: 0,
        transition: "box-shadow 80ms, transform 80ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "2px 2px 0 #000";
        e.currentTarget.style.transform = "translate(-1px,-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <span style={{ width: "16px", height: "2px", background: "#000", display: "block" }} />
      <span style={{ width: "16px", height: "2px", background: "#000", display: "block" }} />
      <span style={{ width: "16px", height: "2px", background: "#000", display: "block" }} />
    </button>
  );
}
