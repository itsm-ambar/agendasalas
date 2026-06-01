import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { BookingForm } from "@/components/BookingForm";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate, fmtRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: { slug: string } }) {
  const user = await requireUser();
  const room = await prisma.room.findUnique({ where: { slug: params.slug } });
  if (!room || !room.active) notFound();

  const upcoming = await prisma.booking.findMany({
    where: { roomId: room.id, status: { in: ["CONFIRMED", "PENDING"] }, end: { gte: new Date() } },
    orderBy: { start: "asc" },
    take: 12,
    include: { organizer: true },
  });

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-ink-mute hover:text-ink">
        ← Voltar para as salas
      </Link>

      <div className="card relative overflow-hidden p-6">
        <span className="absolute left-0 top-0 h-full w-2" style={{ backgroundColor: room.color }} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{room.name}</h1>
            <p className="mt-1 text-ink-soft">
              {room.location ? `${room.location} · ` : ""}
              {room.capacity} lugares
            </p>
            {room.description && <p className="mt-2 max-w-prose text-sm text-ink-mute">{room.description}</p>}
          </div>
          {room.requiresApproval && (
            <span className="badge border-gold/30 bg-amber-50 text-gold">Requer aprovação da diretoria</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="font-display text-lg font-semibold">Próximas reservas</h2>
          <div className="card mt-3 divide-y divide-paper-line">
            {upcoming.length === 0 && (
              <p className="px-5 py-6 text-sm text-ink-mute">Nenhuma reserva futura. A sala está livre!</p>
            )}
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-24 shrink-0">
                  <div className="text-xs text-ink-mute">{fmtDate(b.start)}</div>
                  <div className="text-sm font-medium tabular-nums">{fmtRange(b.start, b.end)}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.title}</p>
                  <p className="truncate text-xs text-ink-mute">{b.organizer.name ?? b.organizer.email}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </section>

        <aside>
          <BookingForm
            roomId={room.id}
            roomName={room.name}
            requiresApproval={room.requiresApproval}
            defaultOrganizerEmail={user.email ?? ""}
          />
        </aside>
      </div>
    </div>
  );
}
