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
  const term = q.replace(/"/g, "").replace(/'/g, "''");

  try {
    const token = await getAppToken();
    const select = "displayName,mail,userPrincipalName";

    // 1ª tentativa: $search (melhor pra busca por texto; exige ConsistencyLevel: eventual)
    const searchUrl =
      `https://graph.microsoft.com/v1.0/users?$search=` +
      encodeURIComponent(`"displayName:${term}" OR "mail:${term}"`) +
      `&$select=${select}&$top=15&$count=true`;

    let res = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}`, ConsistencyLevel: "eventual" },
    });

    // 2ª tentativa (fallback): $filter com startswith
    if (!res.ok) {
      const errTxt = await res.text().catch(() => "");
      console.warn("[people] $search falhou", res.status, errTxt);
      const filter = encodeURIComponent(
        `startswith(displayName,'${term}') or startswith(mail,'${term}') or startswith(userPrincipalName,'${term}')`,
      );
      const filterUrl = `https://graph.microsoft.com/v1.0/users?$filter=${filter}&$select=${select}&$top=15&$count=true`;
      res = await fetch(filterUrl, {
        headers: { Authorization: `Bearer ${token}`, ConsistencyLevel: "eventual" },
      });
      if (!res.ok) {
        console.warn("[people] $filter falhou", res.status, await res.text().catch(() => ""));
        return [];
      }
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

/** Versão diagnóstica: retorna também o status/erro do Graph para a página de diagnóstico. */
export async function searchPeopleDiagnostic(
  q: string,
): Promise<{ count: number; sample: { name: string; email: string }[]; graph: string }> {
  const query = q.trim();
  if (query.length < 2) return { count: 0, sample: [], graph: "termo muito curto" };

  let graph = "ok";
  if (!graphConfigured()) {
    graph = "Graph não configurado (faltam variáveis)";
  } else {
    try {
      const token = await getAppToken();
      const term = query.replace(/"/g, "").replace(/'/g, "''");
      const url =
        `https://graph.microsoft.com/v1.0/users?$search=` +
        encodeURIComponent(`"displayName:${term}" OR "mail:${term}"`) +
        `&$select=displayName,mail&$top=5&$count=true`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, ConsistencyLevel: "eventual" },
      });
      graph = res.ok ? `OK (${res.status})` : `${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`;
    } catch (e) {
      graph = `exceção: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  const people = await searchPeople(query);
  return { count: people.length, sample: people.slice(0, 5).map((p) => ({ name: p.name, email: p.email })), graph };
}
export async function rememberContact(email: string, name?: string) {
  const e = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return;
  await prisma.contact.upsert({
    where: { email: e },
    update: name ? { name } : {},
    create: { email: e, name: name?.trim() || null, external: true },
  });
}
