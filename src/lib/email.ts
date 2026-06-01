import "server-only";
import { createEvent, type EventAttributes } from "ics";
import { sendMailViaGraph, graphConfigured } from "@/lib/graph-mail";

type InviteInput = {
  title: string;
  description?: string | null;
  start: Date;
  end: Date;
  roomName: string;
  roomLocation?: string | null;
  organizerName?: string | null;
  organizerEmail: string;
  attendees: { email: string; name?: string | null }[];
  method?: "REQUEST" | "CANCEL";
};

const TZ = process.env.APP_TIMEZONE ?? "America/Sao_Paulo";

function toIcsUTC(d: Date): [number, number, number, number, number] {
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
}

function buildIcs(input: InviteInput): string | null {
  const event: EventAttributes = {
    title: `${input.title} — ${input.roomName}`,
    description: input.description ?? "",
    location: `${input.roomName}${input.roomLocation ? ` (${input.roomLocation})` : ""}`,
    start: toIcsUTC(input.start),
    end: toIcsUTC(input.end),
    startInputType: "utc",
    endInputType: "utc",
    status: input.method === "CANCEL" ? "CANCELLED" : "CONFIRMED",
    method: input.method ?? "REQUEST",
    busyStatus: "BUSY",
    organizer: { name: input.organizerName ?? input.organizerEmail, email: input.organizerEmail },
    attendees: input.attendees.map((a) => ({
      name: a.name ?? a.email,
      email: a.email,
      rsvp: true,
      partstat: "NEEDS-ACTION",
      role: "REQ-PARTICIPANT",
    })),
  };
  const { error, value } = createEvent(event);
  if (error || !value) {
    console.error("Falha ao gerar ICS:", error);
    return null;
  }
  return value;
}

function htmlBody(input: InviteInput): string {
  const dia = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: TZ }).format(input.start);
  const hi = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: TZ }).format(input.start);
  const hf = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: TZ }).format(input.end);
  const cancel = input.method === "CANCEL";
  return `
  <table style="width:100%;background:#F2F2F2;padding:28px 0;font-family:Segoe UI,system-ui,Arial,sans-serif">
    <tr><td align="center">
      <table style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E4E4E8">
        <tr><td style="background:${cancel ? "#303030" : "#FB0047"};padding:22px 26px">
          <div style="font-size:12px;letter-spacing:.06em;color:#fff;opacity:.85">${cancel ? "REUNIAO CANCELADA" : "CONVITE DE REUNIAO"}</div>
          <div style="font-size:21px;font-weight:700;color:#fff;margin-top:4px">${input.title}</div>
        </td></tr>
        <tr><td style="padding:24px 26px">
          <table style="width:100%;font-size:14px;line-height:1.7;color:#080F26">
            <tr><td style="color:#6B7184;width:96px">Sala</td><td><b>${input.roomName}</b>${input.roomLocation ? ` &middot; ${input.roomLocation}` : ""}</td></tr>
            <tr><td style="color:#6B7184">Data</td><td>${dia}</td></tr>
            <tr><td style="color:#6B7184">Horario</td><td>${hi} as ${hf}</td></tr>
            <tr><td style="color:#6B7184">Organizador</td><td>${input.organizerName ?? input.organizerEmail}</td></tr>
          </table>
          ${input.description ? `<p style="margin-top:16px;color:#2a3149;border-top:1px solid #E4E4E8;padding-top:14px">${input.description}</p>` : ""}
          <p style="margin-top:18px;font-size:12px;color:#6B7184">${cancel ? "Esta reuniao foi cancelada e sera removida do seu calendario." : "O anexo (.ics) adiciona esta reuniao ao seu calendario (Outlook, Teams, Google)."}</p>
        </td></tr>
        <tr><td style="padding:16px 26px;background:#F2F2F2">
          <span style="font-size:11px;color:#9AA0AD">Autodoc &middot; Reserva de Salas — mensagem automatica, nao responda este e-mail.</span>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

export async function sendInvite(input: InviteInput) {
  const recipients = Array.from(
    new Set([input.organizerEmail, ...input.attendees.map((a) => a.email)].map((e) => e.toLowerCase())),
  ).filter(Boolean);

  if (recipients.length === 0) return { skipped: true as const };

  if (!graphConfigured()) {
    console.warn(`[email] Graph nao configurado — convite NAO enviado. Destinatarios: ${recipients.join(", ")}`);
    return { skipped: true as const };
  }

  const ics = buildIcs(input) ?? undefined;
  const subjectPrefix = input.method === "CANCEL" ? "Cancelado: " : "Convite: ";

  try {
    await sendMailViaGraph({
      to: recipients,
      subject: `${subjectPrefix}${input.title} — ${input.roomName}`,
      htmlBody: htmlBody(input),
      ics,
      icsMethod: input.method ?? "REQUEST",
    });
    return { sent: true as const };
  } catch (e) {
    console.error("[email] Falha ao enviar convite via Graph:", e);
    return { error: true as const };
  }
}
