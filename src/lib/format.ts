const TZ = "America/Sao_Paulo";

export function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: TZ }).format(new Date(d));
}
export function fmtDateLong(d: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: TZ }).format(new Date(d));
}
export function fmtTime(d: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: TZ }).format(new Date(d));
}
export function fmtRange(start: Date | string, end: Date | string) {
  return `${fmtTime(start)}–${fmtTime(end)}`;
}
export function fmtDateTime(d: Date | string) {
  return `${fmtDate(d)} · ${fmtTime(d)}`;
}

/** "2025-06-02" + "14:30" interpretado no fuso de São Paulo (UTC-3, sem horário de verão) -> Date */
export function combineDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00-03:00`);
}

/** Chave de data (yyyy-mm-dd) no fuso de São Paulo, para comparar dias. */
export function spDateKey(d: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d));
}

export function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Aguardando aprovação", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  CONFIRMED: { label: "Confirmada", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  REJECTED: { label: "Recusada", cls: "bg-rose-100 text-rose-700 border-rose-200" },
  CANCELLED: { label: "Cancelada", cls: "bg-stone-100 text-stone-500 border-stone-200" },
};
