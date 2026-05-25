import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth?callbackUrl=/dashboard");
  if (session.user.role !== "ORGANISER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-navy-700 flex">
      <DashboardSidebar />
      {/* Main content — offset for sidebar */}
      <main className="flex-1 ml-60 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
