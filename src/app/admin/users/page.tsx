import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { UserRoleSelect } from "@/components/UserRoleSelect";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  if (admin.role !== "IT_ADMIN") redirect("/admin");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Usuários</h1>
        <p className="mt-1 text-ink-soft">
          Defina quem é recepção, diretoria (aprova salas restritas) ou TI. Alterações exigem novo login do usuário para
          valer no acesso.
        </p>
      </div>

      <div className="card divide-y divide-paper-line">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
              {(u.name ?? u.email).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.name ?? "—"}</p>
              <p className="truncate text-xs text-ink-mute">
                {u.email} · desde {fmtDate(u.createdAt)}
              </p>
            </div>
            {u.id === admin.id ? (
              <span className="badge border-brand/30 bg-brand-soft text-brand-dark">Você (TI)</span>
            ) : (
              <UserRoleSelect userId={u.id} role={u.role} />
            )}
          </div>
        ))}
        {users.length === 0 && <p className="px-5 py-6 text-sm text-ink-mute">Nenhum usuário ainda.</p>}
      </div>
    </div>
  );
}
