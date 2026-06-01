import Link from "next/link";
import { fmtRange } from "@/lib/format";

type RoomCardProps = {
  room: {
    slug: string;
    name: string;
    location: string | null;
    capacity: number;
    color: string;
    requiresApproval: boolean;
    description: string | null;
  };
  nextBooking?: { start: Date; end: Date; title: string } | null;
  busyNow?: boolean;
};

export function RoomCard({ room, nextBooking, busyNow }: RoomCardProps) {
  return (
    <Link
      href={`/dashboard/rooms/${room.slug}`}
      className="card group relative overflow-hidden p-5 transition hover:shadow-lift"
    >
      <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: room.color }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight">{room.name}</h3>
          <p className="mt-0.5 text-sm text-ink-mute">
            {room.location ? `${room.location} · ` : ""}
            {room.capacity} lugares
          </p>
        </div>
        <span
          className={`badge ${
            busyNow ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {busyNow ? "Ocupada agora" : "Livre agora"}
        </span>
      </div>

      {room.requiresApproval && (
        <span className="mt-3 inline-flex badge border-gold/30 bg-amber-50 text-gold">Requer aprovação</span>
      )}

      <div className="mt-4 border-t border-paper-line pt-3 text-sm">
        {nextBooking ? (
          <p className="text-ink-soft">
            <span className="text-ink-mute">Próxima: </span>
            {fmtRange(nextBooking.start, nextBooking.end)} · {nextBooking.title}
          </p>
        ) : (
          <p className="text-ink-mute">Sem reservas próximas</p>
        )}
      </div>

      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand group-hover:gap-1.5">
        Reservar
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
