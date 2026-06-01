import "server-only";

// Reaproveita as credenciais do app do Azure já usadas no login.
function extractTenant(): string | undefined {
  // Extrai o tenant do ISSUER (https://login.microsoftonline.com/<tenant>/v2.0)
  const iss = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER ?? "";
  const m = iss.match(/login\.microsoftonline\.com\/([^/]+)/);
  return m?.[1];
}

const TENANT = extractTenant();
const CLIENT_ID = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
const CLIENT_SECRET = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;
const MAIL_FROM = process.env.MAIL_FROM; // ex.: alertas.itsm@autodoc.com.br

let cachedToken: { token: string; expiresAt: number } | null = null;

export function graphConfigured(): boolean {
  return !!(TENANT && CLIENT_ID && CLIENT_SECRET && MAIL_FROM);
}

/** Estado das variáveis para a página de diagnóstico (sem revelar segredos). */
export function graphStatus() {
  return {
    tenant: !!TENANT,
    clientId: !!CLIENT_ID,
    clientSecret: !!CLIENT_SECRET,
    mailFrom: MAIL_FROM ?? null,
  };
}

export async function getAppToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const url = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token Graph falhou: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 600) * 1000 };
  return data.access_token;
}

type SendArgs = {
  to: string[];
  subject: string;
  htmlBody: string;
  ics?: string; // conteúdo do arquivo .ics (opcional)
  icsMethod?: "REQUEST" | "CANCEL";
};

/** Diagnóstico: tenta obter token e enviar 1 e-mail; devolve detalhe do erro se falhar. */
export async function graphSelfTest(to: string): Promise<{ ok: boolean; detail: string }> {
  if (!graphConfigured()) {
    const missing = [
      !TENANT && "tenant (ISSUER)",
      !CLIENT_ID && "AUTH_MICROSOFT_ENTRA_ID_ID",
      !CLIENT_SECRET && "AUTH_MICROSOFT_ENTRA_ID_SECRET",
      !MAIL_FROM && "MAIL_FROM",
    ].filter(Boolean);
    return { ok: false, detail: `Faltam variáveis: ${missing.join(", ")}` };
  }
  try {
    await sendMailViaGraph({
      to: [to],
      subject: "[TESTE] Autodoc Reserva de Salas",
      htmlBody:
        "<p>Este é um e-mail de teste do sistema de reservas. Se você recebeu, o envio via Microsoft Graph está funcionando. ✅</p>",
    });
    return { ok: true, detail: `E-mail de teste enviado para ${to} (caixa ${MAIL_FROM}).` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

type CalendarEventArgs = {
  organizerEmail: string; // dono do evento (quem reservou)
  subject: string;
  bodyHtml: string;
  startUTC: Date;
  endUTC: Date;
  location: string;
  attendees: { email: string; name?: string | null }[];
  withTeams: boolean;
};

/**
 * Cria um evento no calendário do organizador via Graph e convida os participantes.
 * Retorna o link do Teams (se gerado). Requer permissões de aplicativo
 * Calendars.ReadWrite e (para Teams) OnlineMeetings.ReadWrite + Application Access Policy.
 */
export async function createCalendarEvent(args: CalendarEventArgs): Promise<{ ok: boolean; joinUrl?: string; eventId?: string; detail?: string }> {
  if (!graphConfigured()) return { ok: false, detail: "Graph não configurado" };
  try {
    const token = await getAppToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(args.organizerEmail)}/events`;

    const body: Record<string, unknown> = {
      subject: args.subject,
      body: { contentType: "HTML", content: args.bodyHtml },
      start: { dateTime: args.startUTC.toISOString().slice(0, 19), timeZone: "UTC" },
      end: { dateTime: args.endUTC.toISOString().slice(0, 19), timeZone: "UTC" },
      location: { displayName: args.location },
      attendees: args.attendees.map((a) => ({
        emailAddress: { address: a.email, name: a.name ?? a.email },
        type: "required",
      })),
    };
    if (args.withTeams) {
      body.isOnlineMeeting = true;
      body.onlineMeetingProvider = "teamsForBusiness";
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = `${res.status}: ${(await res.text().catch(() => "")).slice(0, 400)}`;
      console.warn("[calendar] criação falhou", detail);
      return { ok: false, detail };
    }
    const data = (await res.json()) as { id?: string; onlineMeeting?: { joinUrl?: string } };
    return { ok: true, joinUrl: data.onlineMeeting?.joinUrl, eventId: data.id };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Cancela (deleta) um evento do calendário do organizador, se tivermos o ID. */
export async function deleteCalendarEvent(organizerEmail: string, eventId: string): Promise<boolean> {
  if (!graphConfigured()) return false;
  try {
    const token = await getAppToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(organizerEmail)}/events/${eventId}`;
    const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

/** Envia e-mail pela caixa compartilhada via Microsoft Graph (sendMail). */
export async function sendMailViaGraph({ to, subject, htmlBody, ics, icsMethod }: SendArgs) {
  const token = await getAppToken();
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(MAIL_FROM!)}/sendMail`;

  const message: Record<string, unknown> = {
    subject,
    body: { contentType: "HTML", content: htmlBody },
    toRecipients: to.map((email) => ({ emailAddress: { address: email } })),
  };

  if (ics) {
    message.attachments = [
      {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: "convite.ics",
        contentType: `text/calendar; method=${icsMethod ?? "REQUEST"}`,
        contentBytes: Buffer.from(ics).toString("base64"),
      },
    ];
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!res.ok && res.status !== 202) {
    throw new Error(`Graph sendMail falhou: ${res.status} ${await res.text()}`);
  }
}
