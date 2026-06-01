"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideBookingAction } from "@/app/admin/actions";

export function ApprovalActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function decide(approve: boolean) {
    setErr(null);
    startTransition(async () => {
      const res = await decideBookingAction(bookingId, approve, note);
      if (!res.ok) setErr(res.error ?? "Falha ao processar.");
      else router.refresh();
    });
  }

  return (
    <div className="mt-3 border-t border-paper-line pt-3">
      <input
        className="field mb-2 text-sm"
        placeholder="Observação (opcional, enviada ao solicitante)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={() => decide(true)} disabled={pending} className="btn-primary flex-1 text-sm">
          {pending ? "..." : "Aprovar"}
        </button>
        <button onClick={() => decide(false)} disabled={pending} className="btn-danger flex-1 text-sm">
          Recusar
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
    </div>
  );
}
