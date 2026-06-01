"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { todayISO } from "@/lib/format";
import { createBookingAction } from "@/app/dashboard/actions";

type Props = {
  roomId: string;
  roomName: string;
  requiresApproval: boolean;
  defaultOrganizerEmail: string;
};

export function BookingForm({ roomId, roomName, requiresApproval, defaultOrganizerEmail }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [attInput, setAttInput] = useState("");
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  function addAttendee() {
    const e = attInput.trim().toLowerCase();
    if (!e) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      setMsg({ type: "error", text: `E-mail inválido: ${e}` });
      return;
    }
    if (!attendees.includes(e)) setAttendees([...attendees, e]);
    setAttInput("");
    setMsg(null);
  }

  function submit() {
    setMsg(null);
    if (!title.trim()) {
      setMsg({ type: "error", text: "Dê um título para a reunião." });
      return;
    }
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
      if (!res.ok) {
        setMsg({ type: "error", text: res.error ?? "Não foi possível reservar." });
        return;
      }
      setMsg({
        type: "ok",
        text: res.pending
          ? "Solicitação enviada! A diretoria precisa aprovar esta sala. Você será avisado."
          : "Sala reservada e convites enviados!",
      });
      setTitle("");
      setDescription("");
      setAttendees([]);
      router.refresh();
    });
  }

  return (
    <div className="card p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold">Reservar {roomName}</h3>
      {requiresApproval && (
        <p className="mt-1 text-sm text-gold">
          Esta sala exige aprovação da diretoria — sua reserva ficará pendente até ser aprovada.
        </p>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <label className="label">Título da reunião</label>
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Alinhamento de projeto"
          />
        </div>

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

        <div>
          <label className="label">Participantes (recebem o convite por e-mail)</label>
          <div className="flex gap-2">
            <input
              className="field"
              value={attInput}
              onChange={(e) => setAttInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addAttendee();
                }
              }}
              placeholder="email@empresa.com e Enter"
            />
            <button type="button" onClick={addAttendee} className="btn-ghost whitespace-nowrap">
              Adicionar
            </button>
          </div>
          <p className="mt-1.5 text-xs text-ink-mute">
            Você ({defaultOrganizerEmail}) já é incluído automaticamente como organizador.
          </p>
          {attendees.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attendees.map((a) => (
                <span key={a} className="badge border-paper-line bg-paper text-ink-soft">
                  {a}
                  <button
                    type="button"
                    onClick={() => setAttendees(attendees.filter((x) => x !== a))}
                    className="ml-1 text-ink-mute hover:text-rose-600"
                    aria-label={`Remover ${a}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Observações (opcional)</label>
          <textarea
            className="field min-h-[72px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Pauta, link da call, etc."
          />
        </div>

        {msg && (
          <div
            className={`rounded-xl border px-3.5 py-2.5 text-sm ${
              msg.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-brand/30 bg-brand-soft text-brand-dark"
            }`}
          >
            {msg.text}
          </div>
        )}

        <button onClick={submit} disabled={pending} className="btn-primary w-full">
          {pending ? "Enviando..." : requiresApproval ? "Solicitar reserva" : "Reservar sala"}
        </button>
      </div>
    </div>
  );
}
