import { requireUser } from "@/lib/authz";
import { TopNav } from "@/components/TopNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
