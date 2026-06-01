import "server-only";
import { prisma } from "@/lib/prisma";
import { getAppToken, graphConfigured } from "@/lib/graph-mail";

export type Person = { email: string; name: string; source: "tenant" | "contact" };

/**
 * Busca pessoas no diretório do tenant via Microsoft Graph usando a credencial
 * de APLICATIVO (a mesma do envio de e-mail). Requer a permissão de aplicativo
 * User.Read.All concedida no Azure.
 */
async function searchGraph(q: string): Promise<Person[]> {
  if (!graphConfigured()) return [];
  const term = q.replace(/'/g, "''");
  const filter = encodeURIComponent(
    `startswith(displayName,'${term}') or startswith(mail,'${term}') or startswith(userPrincipalName,'${term}')`,
  );
  const url = `https://graph.microsoft.com/v1.0/users?$filter=${filter}&$select=displayName,mail,userPrincipalName&$top=15&$count=true`;

  try {
    const token = await getAppToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, ConsistencyLevel: "eventual" },
    });
    if (!res.ok) {
      console.warn("[people] Graph respondeu", res.status, await res.text().catch(() => ""));
      return [];
    }
    const data = (await res.json()) as {
      value: { displayName?: string; mail?: string; userPrincipalName?: string }[];
    };
    return data.value
      .map((u): Person | null => {
        const email = (u.mail || u.userPrincipalName || "").toLowerCase();
        return email ? { email, name: u.displayName || email, source: "tenant" } : null;
      })
      .filter((p): p is Person => p !== null);
  } catch (e) {
    console.warn("[people] erro ao consultar Graph:", e);
    return [];
  }
}

/** Busca no catálogo local (externos gravados + qualquer contato salvo). */
async function searchContacts(q: string): Promise<Person[]> {
  const rows = await prisma.contact.findMany({
    where: {
      OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }],
    },
    take: 8,
    orderBy: { name: "asc" },
  });
  return rows.map((c) => ({ email: c.email, name: c.name || c.email, source: "contact" as const }));
}

export async function searchPeople(q: string): Promise<Person[]> {
  const query = q.trim();
  if (query.length < 2) return [];

  const [tenant, contacts] = await Promise.all([searchGraph(query), searchContacts(query)]);

  // tenant tem prioridade; dedup por e-mail.
  const seen = new Set<string>();
  const out: Person[] = [];
  for (const p of [...tenant, ...contacts]) {
    if (seen.has(p.email)) continue;
    seen.add(p.email);
    out.push(p);
  }
  return out.slice(0, 12);
}

/** Grava um e-mail externo no catálogo para aparecer em buscas futuras. */
export async function rememberContact(email: string, name?: string) {
  const e = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return;
  await prisma.contact.upsert({
    where: { email: e },
    update: name ? { name } : {},
    create: { email: e, name: name?.trim() || null, external: true },
  });
}
