import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isApprover } from "@/lib/authz";
import { ApprovalActions } from "@/components/ApprovalActions";
import { fmtDate, fmtRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const admin = await requireAdmin();
  if (!isApprover(admin.role)) redirect("/admin");

  const pending = await prisma.booking.findMany({
    where: { status: "PENDING" },
    orderBy: { start: "asc" },
    include: { room: true, organizer: true, attendees: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Aprovações</h1>
        <p className="mt-1 text-ink-soft">Reservas de salas restritas aguardando sua decisão.</p>
      </div>

      {pending.length === 0 ? (
        <div className="card p-8 text-center text-ink-mute">Nenhuma solicitação pendente. Tudo em dia! ✅</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">{b.title}</p>
                  <p className="text-sm text-ink-mute">{b.room.name}</p>
                </div>
                <span className="h-10 w-1.5 rounded-full" style={{ backgroundColor: b.room.color }} />
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <Row k="Quando" v={`${fmtDate(b.start)} · ${fmtRange(b.start, b.end)}`} />
                <Row k="Solicitante" v={b.organizer.name ?? b.organizer.email} />
                <Row k="Convidados" v={b.attendees.length ? b.attendees.map((a) => a.email).join(", ") : "—"} />
                {b.description && <Row k="Obs." v={b.description} />}
              </dl>
              <ApprovalActions bookingId={b.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-ink-mute">{k}</dt>
      <dd className="min-w-0 flex-1 text-ink-soft">{v}</dd>
    </div>
  );
}
