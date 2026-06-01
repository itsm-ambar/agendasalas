import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { RoomEditor } from "@/components/RoomEditor";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  await requireAdmin();
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Salas</h1>
          <p className="mt-1 text-ink-soft">Crie, edite e ative/desative salas de reunião.</p>
        </div>
        <RoomEditor />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {rooms.map((r) => (
          <div key={r.id} className="card relative overflow-hidden p-5">
            <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: r.color }} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{r.name}</h3>
                  {!r.active && <span className="badge border-stone-200 bg-stone-100 text-stone-500">Inativa</span>}
                </div>
                <p className="text-sm text-ink-mute">
                  {r.location ? `${r.location} · ` : ""}
                  {r.capacity} lugares · /{r.slug}
                </p>
                {r.requiresApproval && (
                  <span className="mt-2 inline-flex badge border-gold/30 bg-amber-50 text-gold">Requer aprovação</span>
                )}
              </div>
              <RoomEditor room={r} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
