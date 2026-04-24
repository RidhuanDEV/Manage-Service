import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profil Saya | Manage Service",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const initialData = {
    name: session.user.name || "",
    email: session.user.email || "",
    role: session.user.role?.label || session.user.role?.name || "Unknown Role",
  };

  return (
    <div style={{ padding: "1rem 0" }}>
      <ProfileForm initialData={initialData} />
    </div>
  );
}
