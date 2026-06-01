import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { RoomCard } from "@/components/RoomCard";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: [{ requiresApproval: "desc" }, { name: "asc" }],
    include: {
      bookings: {
        where: { status: { in: ["CONFIRMED", "PENDING"] }, end: { gte: now } },
        orderBy: { start: "asc" },
        take: 1,
      },
    },
  });

  const todays = await prisma.booking.findMany({
    where: { status: { in: ["CONFIRMED", "PENDING"] }, start: { gte: startOfDay, lte: endOfDay } },
    orderBy: { start: "asc" },
    include: { room: true, organizer: true },
  });

  function busyNow(slug: string) {
    return todays.some(
      (b) => b.room.slug === slug && b.status === "CONFIRMED" && b.start <= now && b.end > now,
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-ink-mute">Olá, {user.name?.split(" ")[0] ?? "colega"} 👋</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Salas de reunião</h1>
        <p className="mt-1 text-ink-soft">Escolha uma sala para ver a disponibilidade e reservar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <RoomCard
            key={r.id}
            room={r}
            busyNow={busyNow(r.slug)}
            nextBooking={r.bookings[0] ? { start: r.bookings[0].start, end: r.bookings[0].end, title: r.bookings[0].title } : null}
          />
        ))}
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold">Agenda de hoje</h2>
        <div className="card mt-3 divide-y divide-paper-line">
          {todays.length === 0 && <p className="px-5 py-6 text-sm text-ink-mute">Nenhuma reserva para hoje.</p>}
          {todays.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="h-9 w-1 rounded-full" style={{ backgroundColor: b.room.color }} />
              <div className="w-28 shrink-0 text-sm font-medium tabular-nums">{fmtRange(b.start, b.end)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.title}</p>
                <p className="truncate text-xs text-ink-mute">
                  {b.room.name} · {b.organizer.name ?? b.organizer.email}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
