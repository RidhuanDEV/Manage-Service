import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layouts/Sidebar";
import { TopBar } from "@/components/layouts/TopBar";
import { BottomNavBar } from "@/components/layouts/BottomNavBar";

// Server Component — authenticates and renders the dashboard shell
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-bg)] relative">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <TopBar />
        <main
          className="flex-1 w-full mx-auto"
          style={{ padding: "clamp(1rem, 3vw, 1.5rem)", paddingBottom: "6rem", maxWidth: "1400px" }}
        >
          {children}
        </main>
      </div>

      <BottomNavBar />
    </div>
  );
}
