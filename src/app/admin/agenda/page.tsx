import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { CalendarGrid } from "@/components/CalendarGrid";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";

function todaySP() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  await requireAdmin();
  const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? "") ? searchParams.date! : todaySP();

  // janela do dia em UTC (SP = UTC-3)
  const dayStart = new Date(`${dateStr}T00:00:00-03:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59-03:00`);

  const [rooms, bookings] = await Promise.all([
    prisma.room.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "PENDING"] },
        start: { lte: dayEnd },
        end: { gte: dayStart },
      },
      include: { organizer: true },
      orderBy: { start: "asc" },
    }),
  ]);

  return (
    <div className="space-y-2">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Agenda</h1>
        <p className="mt-1 text-ink-soft">Visão do dia de todas as salas. Reserve, edite e acompanhe tudo aqui.</p>
      </div>
      <CalendarGrid
        dateStr={dateStr}
        rooms={rooms.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          color: r.color,
          requiresApproval: r.requiresApproval,
        }))}
        bookings={bookings.map((b) => ({
          id: b.id,
          roomId: b.roomId,
          title: b.title,
          organizerName: b.organizer.name ?? b.organizer.email,
          organizerEmail: b.organizer.email,
          start: b.start.toISOString(),
          end: b.end.toISOString(),
          status: b.status,
        }))}
      />
    </div>
  );
}
