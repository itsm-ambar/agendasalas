import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { StatusBadge } from "@/components/StatusBadge";
import { CancelButton } from "@/components/CancelButton";
import { fmtDate, fmtRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const now = new Date();

  const [pendingCount, confirmedCount, roomCount, upcoming] = await Promise.all([
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED", end: { gte: now } } }),
    prisma.room.count({ where: { active: true } }),
    prisma.booking.findMany({
      where: { status: { in: ["CONFIRMED", "PENDING"] }, end: { gte: now } },
      orderBy: { start: "asc" },
      take: 40,
      include: { room: true, organizer: true, attendees: true },
    }),
  ]);

  const stats = [
    { label: "Aprovações pendentes", value: pendingCount, accent: "text-gold" },
    { label: "Reservas confirmadas", value: confirmedCount, accent: "text-brand" },
    { label: "Salas ativas", value: roomCount, accent: "text-ink" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Painel administrativo</h1>
        <p className="mt-1 text-ink-soft">Acompanhe a agenda de todas as salas em tempo real.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className={`font-display text-3xl font-bold ${s.accent}`}>{s.value}</div>
            <div className="mt-1 text-sm text-ink-mute">{s.label}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold">Próximas reservas (todas as salas)</h2>
        <div className="card mt-3 divide-y divide-paper-line">
          {upcoming.length === 0 && <p className="px-5 py-6 text-sm text-ink-mute">Sem reservas futuras.</p>}
          {upcoming.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="h-10 w-1 rounded-full" style={{ backgroundColor: b.room.color }} />
              <div className="w-28 shrink-0">
                <div className="text-xs text-ink-mute">{fmtDate(b.start)}</div>
                <div className="text-sm font-medium tabular-nums">{fmtRange(b.start, b.end)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.title}</p>
                <p className="truncate text-xs text-ink-mute">
                  {b.room.name} · {b.organizer.name ?? b.organizer.email}
                  {b.attendees.length > 0 && ` · ${b.attendees.length} convidado(s)`}
                </p>
              </div>
              <StatusBadge status={b.status} />
              <CancelButton bookingId={b.id} label="Cancelar" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
