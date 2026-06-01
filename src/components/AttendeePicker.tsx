"use client";

import { useEffect, useRef, useState } from "react";

type Person = { email: string; name: string; source: "tenant" | "contact" };

export function AttendeePicker({
  value,
  onChange,
}: {
  value: { email: string; name?: string }[];
  onChange: (v: { email: string; name?: string }[]) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // debounce da busca
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/people?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        setResults(data.people ?? []);
        setOpen(true);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // fecha ao clicar fora
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function add(p: { email: string; name?: string }) {
    const email = p.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    if (!value.some((v) => v.email === email)) onChange([...value, { email, name: p.name }]);
    setQ("");
    setResults([]);
    setOpen(false);
  }

  function tryAddRaw() {
    // permite digitar um e-mail externo completo e adicionar com Enter
    const email = q.trim().toLowerCase();
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) add({ email });
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && results[active]) add(results[active]);
      else tryAddRaw();
    } else if (e.key === "," ) {
      e.preventDefault();
      tryAddRaw();
    }
  }

  function addCurrent() {
    // prioriza a sugestão destacada; se não houver, tenta o e-mail digitado
    if (open && results[active]) add(results[active]);
    else tryAddRaw();
  }

  return (
    <div className="relative" ref={boxRef}>
      <div className="flex gap-2">
        <input
          className="field"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Digite um nome ou e-mail…"
          autoComplete="off"
        />
        <button type="button" onClick={addCurrent} className="btn-ghost whitespace-nowrap">
          Adicionar
        </button>
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-paper-line bg-paper-card shadow-lift">
          {loading && <div className="px-3.5 py-2.5 text-sm text-ink-mute">Buscando…</div>}
          {!loading &&
            results.map((p, i) => (
              <button
                key={p.email}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => add(p)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left ${
                  i === active ? "bg-brand-soft" : "hover:bg-paper"
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block truncate text-xs text-ink-mute">{p.email}</span>
                </span>
                {p.source === "contact" && (
                  <span className="badge border-paper-line bg-paper text-ink-mute">externo</span>
                )}
              </button>
            ))}
          {!loading && results.length === 0 && (
            <div className="px-3.5 py-2.5 text-sm text-ink-mute">Nada encontrado.</div>
          )}
        </div>
      )}

      {/* chips dos selecionados */}
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((a) => (
            <span key={a.email} className="badge border-paper-line bg-paper text-ink-soft">
              {a.name ? `${a.name} · ${a.email}` : a.email}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.email !== a.email))}
                className="ml-1 text-ink-mute hover:text-rose-600"
                aria-label={`Remover ${a.email}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
