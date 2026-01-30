import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/utils/session";
import AdminSidebar from "./components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Login page doesn't need sidebar
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  // Check session
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <AdminSidebar username={session.username} />
        <main className="flex-1 md:ml-64 p-8 pt-20 md:pt-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
