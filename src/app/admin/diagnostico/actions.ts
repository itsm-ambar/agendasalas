"use server";

import { requireAdmin } from "@/lib/authz";
import { graphSelfTest } from "@/lib/graph-mail";

export async function sendTestEmailAction() {
  const admin = await requireAdmin();
  if (!admin.email) return { ok: false, detail: "Sem e-mail no usuário logado." };
  return graphSelfTest(admin.email);
}
