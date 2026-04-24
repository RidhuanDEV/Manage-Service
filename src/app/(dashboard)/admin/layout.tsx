import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

// Admin sub-layout — verifies manage_users permission
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  const canAccessAdmin = hasPermission(
    session.user.permissions ?? [],
    "manage_users"
  );

  if (!canAccessAdmin) redirect("/dashboard");

  return <>{children}</>;
}
