import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { StatusBadge } from "@/components/StatusBadge";
import { CancelButton } from "@/components/CancelButton";
import { fmtDate, fmtRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const user = await requireUser();
  const bookings = await prisma.booking.findMany({
    where: { organizerId: user.id },
    orderBy: { start: "desc" },
    include: { room: true, attendees: true },
  });

  const now = new Date();
  const upcoming = bookings.filter((b) => b.end >= now && !["CANCELLED", "REJECTED"].includes(b.status));
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Minhas reservas</h1>
        <p className="mt-1 text-ink-soft">Reservas que você criou.</p>
      </div>

      <Section title="Próximas" items={upcoming} canCancel />
      <Section title="Histórico" items={past} />

      {bookings.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-ink-mute">Você ainda não fez nenhuma reserva.</p>
          <Link href="/dashboard" className="btn-primary mt-4">
            Reservar uma sala
          </Link>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  canCancel,
}: {
  title: string;
  items: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    status: string;
    room: { name: string; color: string };
    attendees: { email: string }[];
    decisionNote: string | null;
  }[];
  canCancel?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="card mt-3 divide-y divide-paper-line">
        {items.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <span className="h-10 w-1 rounded-full" style={{ backgroundColor: b.room.color }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{b.title}</p>
              <p className="text-xs text-ink-mute">
                {b.room.name} · {fmtDate(b.start)} · {fmtRange(b.start, b.end)}
                {b.attendees.length > 0 && ` · ${b.attendees.length} convidado(s)`}
              </p>
              {b.decisionNote && <p className="mt-1 text-xs italic text-ink-mute">Nota: {b.decisionNote}</p>}
            </div>
            <StatusBadge status={b.status} />
            {canCancel && ["CONFIRMED", "PENDING"].includes(b.status) && <CancelButton bookingId={b.id} />}
          </div>
        ))}
      </div>
    </section>
  );
}
