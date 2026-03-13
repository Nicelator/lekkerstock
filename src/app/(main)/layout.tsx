import Navbar from "@/components/layout/Navbar";
import { getUser } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={
          user
            ? {
                id: user.id,
                email: user.email ?? "",
                name: user.user_metadata?.full_name ?? user.user_metadata?.name,
                role: user.user_metadata?.role,
              }
            : null
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}