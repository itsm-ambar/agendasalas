"use client";

import { useState, useTransition } from "react";
import { testCalendarAction } from "@/app/admin/diagnostico/actions";

export function TestCalendarButton() {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ ok: boolean; detail: string } | null>(null);

  return (
    <div>
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() => start(async () => setRes(await testCalendarAction()))}
      >
        {pending ? "Testando..." : "Testar criação de evento (Teams)"}
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
