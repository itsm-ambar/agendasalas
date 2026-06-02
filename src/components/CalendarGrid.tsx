"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AttendeePicker } from "@/components/AttendeePicker";
import { adminCreateBookingAction, adminCancelBookingAction } from "@/app/admin/agenda/actions";
import { fmtRange, fmtDate } from "@/lib/format";

type Room = { id: string; name: string; slug: string; color: string; requiresApproval: boolean };
type Booking = {
  id: string;
  roomId: string;
  title: string;
  organizerName: string;
  organizerEmail: string;
  start: string; // ISO
  end: string; // ISO
  status: string;
};

type Props = {
  rooms: Room[];
  bookings: Booking[];
  dateStr: string; // yyyy-mm-dd em foco
};

const START_HOUR = 7;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const PX_PER_HOUR = 64;
const TZ = "America/Sao_Paulo";

function spParts(iso: string) {
  // hora/minuto no fuso de SP
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number(f.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(f.find((p) => p.type === "minute")?.value ?? 0);
  return { h, m };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function CalendarGrid({ rooms, bookings, dateStr }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState<{ room: Room; hour: number } | null>(null);

  function changeDay(deltaDays: number) {
    const d = new Date(`${dateStr}T12:00:00`);
    d.setDate(d.getDate() + deltaDays);
    router.push(`/admin/agenda?date=${d.toISOString().slice(0, 10)}`);
  }
  function gotoDate(value: string) {
    if (value) router.push(`/admin/agenda?date=${value}`);
  }

  const nowLine = useMemo(() => {
    const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
    if (todayKey !== dateStr) return null;
    const { h, m } = spParts(new Date().toISOString());
    if (h < START_HOUR || h > END_HOUR) return null;
    return (h - START_HOUR) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR;
  }, [dateStr]);

  const isToday = useMemo(
    () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()) === dateStr,
    [dateStr],
  );

  return (
    <div>
      {/* Cabeçalho com navegação de dia */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => changeDay(-1)} className="btn-ghost h-9 w-9 !px-0" aria-label="Dia anterior">
            ‹
          </button>
          <button onClick={() => changeDay(1)} className="btn-ghost h-9 w-9 !px-0" aria-label="Próximo dia">
            ›
          </button>
        </div>
        {!isToday && (
          <button onClick={() => gotoDate(new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()))} className="btn-ghost">
            Hoje
          </button>
        )}
        <input type="date" value={dateStr} onChange={(e) => gotoDate(e.target.value)} className="field max-w-[180px]" />
        <span className="font-display text-lg font-semibold capitalize">
          {fmtDate(`${dateStr}T12:00:00-03:00`)}
        </span>
        <span className="ml-auto text-sm text-ink-mute">Clique num horário livre para reservar</span>
      </div>

      {/* Grade */}
      <div className="card overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Cabeçalho das salas */}
          <div className="grid border-b border-paper-line" style={{ gridTemplateColumns: `56px repeat(${rooms.length}, 1fr)` }}>
            <div className="border-r border-paper-line" />
            {rooms.map((r) => (
              <div key={r.id} className="flex items-center gap-2 border-r border-paper-line px-3 py-3 last:border-r-0">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: r.color }}
                >
                  {initials(r.name.replace(/^Sala\s+/i, ""))}
                </span>
                <span className="truncate text-sm font-semibold">{r.name}</span>
              </div>
            ))}
          </div>

          {/* Corpo: colunas com linhas de hora */}
          <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${rooms.length}, 1fr)` }}>
            {/* coluna das horas */}
            <div className="border-r border-paper-line">
              {HOURS.map((h) => (
                <div key={h} className="relative border-b border-paper-line text-right" style={{ height: PX_PER_HOUR }}>
                  <span className="absolute -top-2 right-1.5 text-xs text-ink-mute">{h}h</span>
                </div>
              ))}
            </div>

            {/* uma coluna por sala */}
            {rooms.map((r) => {
              const roomBookings = bookings.filter((b) => b.roomId === r.id);
              return (
                <div key={r.id} className="relative border-r border-paper-line last:border-r-0">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setCreating({ room: r, hour: h })}
                      className="block w-full border-b border-paper-line transition hover:bg-brand-soft/40"
                      style={{ height: PX_PER_HOUR }}
                      aria-label={`Reservar ${r.name} às ${h}h`}
                    />
                  ))}

                  {/* blocos de reserva */}
                  {roomBookings.map((b) => {
                    const s = spParts(b.start);
                    const e = spParts(b.end);
                    const top = (s.h - START_HOUR) * PX_PER_HOUR + (s.m / 60) * PX_PER_HOUR;
                    const height = Math.max(
                      22,
                      ((e.h - s.h) * 60 + (e.m - s.m)) * (PX_PER_HOUR / 60),
                    );
                    const pending = b.status === "PENDING";
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelected(b)}
                        className="absolute left-1 right-1 overflow-hidden rounded-lg px-2 py-1 text-left text-white shadow-soft transition hover:brightness-110"
                        style={{
                          top,
                          height,
                          backgroundColor: r.color,
                          opacity: pending ? 0.75 : 1,
                          border: pending ? "2px dashed rgba(255,255,255,.7)" : "none",
                        }}
                      >
                        <span className="block truncate text-xs font-semibold leading-tight">{b.title}</span>
                        <span className="block truncate text-[11px] leading-tight opacity-90">
                          {b.organizerName}
                        </span>
                        {pending && <span className="block text-[10px] opacity-90">aguardando aprovação</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* linha do "agora" */}
            {nowLine !== null && (
              <div
                className="pointer-events-none absolute left-[56px] right-0 z-10 border-t-2 border-brand"
                style={{ top: nowLine }}
              >
                <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-brand" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: detalhes da reserva */}
      {selected && (
        <BookingDetail booking={selected} onClose={() => setSelected(null)} onChanged={() => router.refresh()} />
      )}

      {/* Modal: criar reserva */}
      {creating && (
        <CreateModal
          room={creating.room}
          hour={creating.hour}
          dateStr={dateStr}
          onClose={() => setCreating(null)}
          onCreated={() => {
            setCreating(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function BookingDetail({
  booking,
  onClose,
  onChanged,
}: {
  booking: Booking;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function cancel() {
    if (!confirm("Cancelar esta reserva? Os participantes serão notificados.")) return;
    start(async () => {
      const res = await adminCancelBookingAction(booking.id);
      if (!res.ok) setErr(res.error ?? "Falha ao cancelar.");
      else {
        onChanged();
        onClose();
      }
    });
  }

  return (
    <Overlay onClose={onClose}>
      <h3 className="font-display text-lg font-bold">{booking.title}</h3>
      <dl className="mt-3 space-y-1.5 text-sm">
        <Row k="Horário" v={`${fmtRange(booking.start, booking.end)}`} />
        <Row k="Organizador" v={`${booking.organizerName} (${booking.organizerEmail})`} />
        <Row k="Status" v={booking.status === "PENDING" ? "Aguardando aprovação" : booking.status === "CONFIRMED" ? "Confirmada" : booking.status} />
      </dl>
      {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
      <div className="mt-5 flex gap-2">
        <button onClick={cancel} disabled={pending} className="btn-danger flex-1">
          {pending ? "Cancelando..." : "Cancelar reserva"}
        </button>
        <button onClick={onClose} className="btn-ghost flex-1">
          Fechar
        </button>
      </div>
    </Overlay>
  );
}

function CreateModal({
  room,
  hour,
  dateStr,
  onClose,
  onCreated,
}: {
  room: Room;
  hour: number;
  dateStr: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(`${String(hour).padStart(2, "0")}:00`);
  const [endTime, setEndTime] = useState(`${String(hour + 1).padStart(2, "0")}:00`);
  const [organizer, setOrganizer] = useState<{ email: string; name?: string }[]>([]);
  const [attendees, setAttendees] = useState<{ email: string; name?: string }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  function submit() {
    setMsg(null);
    if (!title.trim()) return setMsg("Dê um título para a reunião.");
    if (organizer.length === 0) return setMsg("Escolha em nome de quem é a reserva (organizador).");
    start(async () => {
      const res = await adminCreateBookingAction({
        roomId: room.id,
        title,
        dateStr,
        startTime,
        endTime,
        organizer: organizer[0],
        attendees,
      });
      if (!res.ok) return setMsg(res.error ?? "Não foi possível reservar.");
      onCreated();
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center gap-2">
        <span className="h-6 w-1.5 rounded-full" style={{ backgroundColor: room.color }} />
        <h3 className="font-display text-lg font-bold">Reservar {room.name}</h3>
      </div>
      {room.requiresApproval && (
        <p className="mt-1 text-sm text-gold">Esta sala exige aprovação da diretoria — ficará pendente.</p>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label className="label">Título</label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Reunião comercial" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Início</label>
            <input type="time" className="field" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="label">Término</label>
            <input type="time" className="field" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Em nome de (organizador)</label>
          <AttendeePicker value={organizer} onChange={(v) => setOrganizer(v.slice(-1))} />
          <p className="mt-1 text-xs text-ink-mute">A reunião e o convite do Teams irão para a agenda desta pessoa.</p>
        </div>
        <div>
          <label className="label">Participantes (opcional)</label>
          <AttendeePicker value={attendees} onChange={setAttendees} />
        </div>
        {msg && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{msg}</p>}
        <div className="flex gap-2">
          <button onClick={submit} disabled={pending} className="btn-primary flex-1">
            {pending ? "Reservando..." : room.requiresApproval ? "Solicitar" : "Reservar"}
          </button>
          <button onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl2 border border-paper-line bg-paper-card p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-ink-mute">{k}</dt>
      <dd className="min-w-0 flex-1 text-ink-soft">{v}</dd>
    </div>
  );
}
