"use server";

import { requireAdmin } from "@/lib/authz";
import { graphSelfTest, createCalendarEvent, deleteCalendarEvent } from "@/lib/graph-mail";
import { searchPeopleDiagnostic } from "@/lib/people";

export async function sendTestEmailAction() {
  const admin = await requireAdmin();
  if (!admin.email) return { ok: false, detail: "Sem e-mail no usuário logado." };
  return graphSelfTest(admin.email);
}

export async function testCalendarAction() {
  const admin = await requireAdmin();
  if (!admin.email) return { ok: false, detail: "Sem e-mail no usuário logado." };
  const start = new Date(Date.now() + 24 * 3600 * 1000);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const evt = await createCalendarEvent({
    organizerEmail: admin.email,
    subject: "[TESTE] Evento Autodoc Reserva de Salas",
    bodyHtml: "Evento de teste. Pode apagar.",
    startUTC: start,
    endUTC: end,
    location: "Teste",
    attendees: [],
    withTeams: true,
  });
  // limpa o evento de teste em seguida
  if (evt.ok && evt.eventId) await deleteCalendarEvent(admin.email, evt.eventId);
  return {
    ok: evt.ok,
    detail: evt.ok
      ? `Evento criado e removido com sucesso${evt.joinUrl ? " (com link do Teams ✅)" : " (SEM link do Teams — falta OnlineMeetings.ReadWrite/policy)"}.`
      : evt.detail ?? "Falhou",
  };
}

export async function testPeopleSearchAction(q: string) {
  await requireAdmin();
  const result = await searchPeopleDiagnostic(q);
  return result;
}
