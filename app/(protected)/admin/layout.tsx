import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");
  return (
    <div className="min-h-screen bg-navy-700">
      <div className="border-b border-white/6 px-6 h-14 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Admin Panel</span>
        <span className="text-xs text-white/20">— SHOWPASS</span>
      </div>
      {children}
    </div>
  );
}
