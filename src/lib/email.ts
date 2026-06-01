import { Resend } from "resend";
import { createEvent, type EventAttributes } from "ics";

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

const FROM = process.env.EMAIL_FROM ?? "AgendaSalas <agenda@example.com>";
const TZ = process.env.APP_TIMEZONE ?? "America/Sao_Paulo";

function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function toIcsArray(d: Date): [number, number, number, number, number] {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
}

function buildIcs(input: InviteInput): string | null {
  const event: EventAttributes = {
    title: `${input.title} — ${input.roomName}`,
    description: input.description ?? "",
    location: `${input.roomName}${input.roomLocation ? ` (${input.roomLocation})` : ""}`,
    start: toIcsArray(input.start),
    end: toIcsArray(input.end),
    startInputType: "local",
    endInputType: "local",
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
  const dia = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: TZ,
  }).format(input.start);
  const hi = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: TZ }).format(input.start);
  const hf = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: TZ }).format(input.end);
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;color:#16201c">
    <div style="background:#FB0047;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0">
      <div style="font-size:13px;opacity:.85;letter-spacing:.04em">CONVITE DE REUNIÃO</div>
      <div style="font-size:20px;font-weight:700;margin-top:4px">${input.title}</div>
    </div>
    <div style="border:1px solid #e6e2d6;border-top:0;border-radius:0 0 14px 14px;padding:24px">
      <table style="width:100%;font-size:14px;line-height:1.6">
        <tr><td style="color:#69756f;width:90px">Sala</td><td><b>${input.roomName}</b>${
          input.roomLocation ? ` · ${input.roomLocation}` : ""
        }</td></tr>
        <tr><td style="color:#69756f">Data</td><td>${dia}</td></tr>
        <tr><td style="color:#69756f">Horário</td><td>${hi} às ${hf}</td></tr>
        <tr><td style="color:#69756f">Organizador</td><td>${input.organizerName ?? input.organizerEmail}</td></tr>
      </table>
      ${
        input.description
          ? `<p style="margin-top:16px;color:#3a4742;border-top:1px solid #e6e2d6;padding-top:14px">${input.description}</p>`
          : ""
      }
      <p style="margin-top:18px;font-size:12px;color:#69756f">O anexo (.ics) adiciona esta reunião ao seu calendário (Outlook, Google, etc.).</p>
    </div>
  </div>`;
}

export async function sendInvite(input: InviteInput) {
  const ics = buildIcs(input);
  const client = resend();
  const recipients = Array.from(
    new Set([input.organizerEmail, ...input.attendees.map((a) => a.email)].map((e) => e.toLowerCase())),
  );

  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY ausente — convite NÃO enviado. Destinatários: ${recipients.join(", ")}`,
    );
    return { skipped: true as const };
  }

  const subjectPrefix = input.method === "CANCEL" ? "Cancelado: " : "Convite: ";
  try {
    await client.emails.send({
      from: FROM,
      to: recipients,
      subject: `${subjectPrefix}${input.title} — ${input.roomName}`,
      html: htmlBody(input),
      attachments: ics
        ? [
            {
              filename: "convite.ics",
              content: Buffer.from(ics).toString("base64"),
              contentType: `text/calendar; method=${input.method ?? "REQUEST"}`,
            },
          ]
        : undefined,
    });
    return { sent: true as const };
  } catch (e) {
    console.error("[email] Falha ao enviar convite:", e);
    return { error: true as const };
  }
}
