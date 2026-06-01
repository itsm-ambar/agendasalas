"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertRoomAction } from "@/app/admin/actions";

type Room = {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  description: string | null;
  color: string;
  requiresApproval: boolean;
  active: boolean;
};

const COLORS = ["#FB0047", "#D6003C", "#080F26", "#303030", "#6B7184", "#9AA0AD"];

export function RoomEditor({ room }: { room?: Room }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState(room?.name ?? "");
  const [location, setLocation] = useState(room?.location ?? "");
  const [capacity, setCapacity] = useState(room?.capacity ?? 4);
  const [description, setDescription] = useState(room?.description ?? "");
  const [color, setColor] = useState(room?.color ?? COLORS[0]);
  const [requiresApproval, setRequiresApproval] = useState(room?.requiresApproval ?? false);
  const [active, setActive] = useState(room?.active ?? true);

  function save() {
    setErr(null);
    startTransition(async () => {
      const res = await upsertRoomAction({
        id: room?.id,
        name,
        location,
        capacity,
        description,
        color,
        requiresApproval,
        active,
      });
      if (!res.ok) setErr(res.error ?? "Erro.");
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={room ? "btn-ghost text-xs" : "btn-primary"}>
        {room ? "Editar" : "+ Nova sala"}
      </button>
    );
  }

  return (
    <div className="card mt-3 space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nome</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Local</label>
          <input className="field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="3º andar" />
        </div>
        <div>
          <label className="label">Capacidade</label>
          <input
            type="number"
            min={1}
            className="field"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Cor</label>
          <div className="flex gap-2 pt-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full ring-2 ${color === c ? "ring-ink" : "ring-transparent"}`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="label">Descrição</label>
        <input className="field" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} />
          Exige aprovação da diretoria
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Ativa
        </label>
      </div>
      {err && <p className="text-xs text-rose-600">{err}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={pending} className="btn-primary text-sm">
          {pending ? "Salvando..." : "Salvar"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost text-sm">
          Cancelar
        </button>
      </div>
    </div>
  );
}
