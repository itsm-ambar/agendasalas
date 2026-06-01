"use client";

import { useState, useTransition } from "react";
import { sendTestEmailAction } from "@/app/admin/diagnostico/actions";

export function TestEmailButton() {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ ok: boolean; detail: string } | null>(null);

  return (
    <div>
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() => start(async () => setRes(await sendTestEmailAction()))}
      >
        {pending ? "Enviando..." : "Enviar e-mail de teste para mim"}
      </button>
      {res && (
        <div
          className={`mt-3 rounded-xl border px-3.5 py-2.5 text-sm ${
            res.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <p className="font-semibold">{res.ok ? "Sucesso" : "Falhou"}</p>
          <p className="mt-1 break-words font-mono text-xs">{res.detail}</p>
        </div>
      )}
    </div>
  );
}
