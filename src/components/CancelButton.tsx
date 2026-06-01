"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelBookingAction } from "@/app/dashboard/actions";

export function CancelButton({ bookingId, label = "Cancelar" }: { bookingId: string; label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    if (!confirm("Cancelar esta reserva? Os participantes serão notificados.")) return;
    setErr(null);
    startTransition(async () => {
      const res = await cancelBookingAction(bookingId);
      if (!res.ok) setErr(res.error ?? "Falha ao cancelar.");
      else router.refresh();
    });
  }

  return (
    <div className="text-right">
      <button onClick={onClick} disabled={pending} className="btn-danger text-xs">
        {pending ? "..." : label}
      </button>
      {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
    </div>
  );
}
