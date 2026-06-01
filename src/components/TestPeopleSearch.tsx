"use client";

import { useState, useTransition } from "react";
import { testPeopleSearchAction } from "@/app/admin/diagnostico/actions";

export function TestPeopleSearch() {
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ count: number; sample: { name: string; email: string }[] } | null>(null);

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="field"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Digite um nome (ex.: ana)"
        />
        <button
          className="btn-primary whitespace-nowrap"
          disabled={pending || q.trim().length < 2}
          onClick={() => start(async () => setRes(await testPeopleSearchAction(q)))}
        >
          {pending ? "Buscando..." : "Buscar pessoas"}
        </button>
      </div>
      {res && (
        <div className="mt-3 rounded-xl border border-paper-line bg-paper px-3.5 py-2.5 text-sm">
          <p className="font-semibold">{res.count} resultado(s)</p>
          {res.sample.length > 0 ? (
            <ul className="mt-1 space-y-0.5">
              {res.sample.map((p) => (
                <li key={p.email} className="text-ink-soft">
                  {p.name} · <span className="font-mono text-xs">{p.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-ink-mute">
              Nenhuma pessoa encontrada. Se o e-mail funciona mas isto está vazio, falta a permissão de
              aplicativo <b>User.Read.All</b> (com consentimento) no Azure.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
