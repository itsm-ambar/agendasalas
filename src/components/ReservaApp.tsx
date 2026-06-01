"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction } from "@/app/dashboard/actions";
import { CancelButton } from "@/components/CancelButton";
import { StatusBadge } from "@/components/StatusBadge";
import { AttendeePicker } from "@/components/AttendeePicker";
import { fmtRange, fmtDate, todayISO, spDateKey } from "@/lib/format";

type Room = {
  id: string;
  name: string;
  capacity: number;
  color: string;
  requiresApproval: boolean;
  description: string | null;
};
type Booking = { roomId: string; title: string; start: string; end: string; status: string };
type MyBooking = {
  id: string;
  title: string;
  roomName: string;
  roomColor: string;
  start: string;
  end: string;
  status: string;
  attendees: number;
  decisionNote: string | null;
};

type Props = {
  rooms: Room[];
  bookings: Booking[];
  myBookings: MyBooking[];
  defaultEmail: string;
  userName: string | null;
};

export function ReservaApp({ rooms, bookings, myBookings, defaultEmail, userName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState<{ email: string; name?: string }[]>([]);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  const room = rooms.find((r) => r.id === roomId);

  const dayBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.roomId === roomId && spDateKey(b.start) === date)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [bookings, roomId, date],
  );

  const upcomingMine = myBookings.filter(
    (b) => new Date(b.end) >= new Date() && !["CANCELLED", "REJECTED"].includes(b.status),
  );

  function submit() {
    setMsg(null);
    if (!room) return;
    if (!title.trim()) return setMsg({ type: "error", text: "Dê um título para a reunião." });
    startTransition(async () => {
      const res = await createBookingAction({
        roomId,
        title,
        description,
        dateStr: date,
        startTime,
        endTime,
        attendees,
      });
      if (!res.ok) return setMsg({ type: "error", text: res.error ?? "Não foi possível reservar." });
      setMsg({
        type: "ok",
        text: res.pending
          ? "Solicitação enviada! A diretoria precisa aprovar esta sala — você será avisado."
          : "Sala reservada com sucesso!",
      });
      setTitle("");
      setDescription("");
      setAttendees([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-mute">Olá, {userName?.split(" ")[0] ?? "colega"} 👋</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Reservar sala</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        {/* Coluna principal: reserva */}
        <div className="space-y-5">
          {/* Seletor de sala */}
          <div>
            <p className="label">1. Escolha a sala</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {rooms.map((r) => {
                const active = r.id === roomId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoomId(r.id)}
                    className={`card relative overflow-hidden p-3.5 text-left transition ${
                      active ? "ring-2 ring-brand" : "hover:border-brand/40"
                    }`}
                  >
                    <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: r.color }} />
                    <div className="flex items-center justify-between gap-2 pl-1.5">
                      <span className="font-semibold">{r.name}</span>
                      <span className="text-xs text-ink-mute">{r.capacity} lugares</span>
                    </div>
                    {r.requiresApproval && (
                      <span className="ml-1.5 mt-1.5 inline-flex badge border-gold/30 bg-amber-50 text-gold">
                        Requer aprovação
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulário */}
          <div className="card p-5 sm:p-6">
            <p className="label">2. Defina o horário</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Data</label>
                <input type="date" className="field" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Início</label>
                <input type="time" className="field" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="label">Término</label>
                <input type="time" className="field" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            {/* Disponibilidade do dia */}
            <div className="mt-4 rounded-xl border border-paper-line bg-paper p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
                {room?.name} · {fmtDate(date + "T12:00:00-03:00")}
              </p>
              {dayBookings.length === 0 ? (
                <p className="mt-1.5 text-sm text-emerald-700">Sala livre o dia todo 🎉</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {dayBookings.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-medium tabular-nums">{fmtRange(b.start, b.end)}</span>
                      <span className="truncate text-ink-soft">{b.title}</span>
                      <StatusBadge status={b.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4">
              <label className="label">Título da reunião</label>
              <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Alinhamento de projeto" />
            </div>

            <div className="mt-4">
              <label className="label">Participantes (recebem o convite)</label>
              <AttendeePicker value={attendees} onChange={setAttendees} />
              <p className="mt-1.5 text-xs text-ink-mute">
                Busque pessoas da Autodoc/Ambar ou digite um e-mail externo. Você ({defaultEmail}) entra como organizador.
              </p>
            </div>

            <div className="mt-4">
              <label className="label">Observações (opcional)</label>
              <textarea className="field min-h-[64px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pauta, link da call, etc." />
            </div>

            {room?.requiresApproval && (
              <p className="mt-4 text-sm text-gold">Esta sala exige aprovação da diretoria — sua reserva ficará pendente.</p>
            )}

            {msg && (
              <div className={`mt-4 rounded-xl border px-3.5 py-2.5 text-sm ${msg.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                {msg.text}
              </div>
            )}

            <button onClick={submit} disabled={pending || !room} className="btn-primary mt-5 w-full">
              {pending ? "Enviando..." : room?.requiresApproval ? "Solicitar reserva" : "Reservar sala"}
            </button>
          </div>
        </div>

        {/* Lateral: minhas reservas */}
        <aside>
          <p className="label">Minhas próximas reservas</p>
          <div className="card divide-y divide-paper-line">
            {upcomingMine.length === 0 && <p className="px-4 py-6 text-sm text-ink-mute">Você não tem reservas futuras.</p>}
            {upcomingMine.map((b) => (
              <div key={b.id} className="px-4 py-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-8 w-1 rounded-full" style={{ backgroundColor: b.roomColor }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-ink-mute">
                      {b.roomName} · {fmtDate(b.start)} · {fmtRange(b.start, b.end)}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <StatusBadge status={b.status} />
                      {["CONFIRMED", "PENDING"].includes(b.status) && <CancelButton bookingId={b.id} />}
                    </div>
                    {b.decisionNote && <p className="mt-1 text-xs italic text-ink-mute">Nota: {b.decisionNote}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
