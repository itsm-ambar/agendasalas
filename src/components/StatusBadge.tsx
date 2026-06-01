import { STATUS_META } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, cls: "bg-stone-100 text-stone-600 border-stone-200" };
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}
