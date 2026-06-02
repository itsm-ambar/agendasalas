import Link from "next/link";
import { requireAdmin, isApprover } from "@/lib/authz";
import { TopNav } from "@/components/TopNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const approver = isApprover(admin.role);

  const tabs = [
    { href: "/admin/agenda", label: "Agenda" },
    { href: "/admin", label: "Visão geral" },
    ...(approver ? [{ href: "/admin/approvals", label: "Aprovações" }] : []),
    { href: "/admin/rooms", label: "Salas" },
    ...(admin.role === "IT_ADMIN" ? [{ href: "/admin/users", label: "Usuários" }] : []),
    ...(admin.role === "IT_ADMIN" ? [{ href: "/admin/diagnostico", label: "Diagnóstico" }] : []),
  ];

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex items-center gap-2 overflow-x-auto rounded-full border border-paper-line bg-paper-card p-1 shadow-soft">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink"
            >
              {t.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
