"use server";

import { requireAdmin } from "@/lib/authz";
import { graphSelfTest } from "@/lib/graph-mail";
import { searchPeople } from "@/lib/people";

export async function sendTestEmailAction() {
  const admin = await requireAdmin();
  if (!admin.email) return { ok: false, detail: "Sem e-mail no usuário logado." };
  return graphSelfTest(admin.email);
}

export async function testPeopleSearchAction(q: string) {
  await requireAdmin();
  const people = await searchPeople(q);
  return { count: people.length, sample: people.slice(0, 5) };
}
