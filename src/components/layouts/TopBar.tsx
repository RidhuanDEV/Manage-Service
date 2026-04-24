import { auth } from "@/lib/auth";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { UserProfileDropdown } from "./UserProfileDropdown";

interface TopBarProps {
  title?: string;
}

// Server Component — reads session directly from server
export async function TopBar({ title }: TopBarProps) {
  const session = await auth();

  return (
    <header className="topbar">
      <div className="hidden md:block">
        <SidebarToggleButton />
      </div>

      {/* Mobile Logo */}
      <div className="md:hidden flex items-center gap-2">
        <div style={{ background: "var(--color-primary)", color: "#000", padding: "4px", border: "2px solid #000", boxShadow: "2px 2px 0px #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
          </svg>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "0.875rem", color: "var(--color-primary)", lineHeight: 1, margin: 0 }}>
            Manage
          </p>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "0.875rem", color: "#000", lineHeight: 1, margin: 0 }}>
            Service
          </p>
        </div>
      </div>

      {title && (
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "1.125rem",
            flex: 1,
          }}
        >
          {title}
        </h1>
      )}

      <div style={{ marginLeft: "auto" }}>
        {session?.user && (
          <UserProfileDropdown user={session.user} />
        )}
      </div>
    </header>
  );
}
