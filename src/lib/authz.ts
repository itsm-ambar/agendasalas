import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const ADMIN_ROLES = ["RECEPTION", "IT_ADMIN", "DIRECTOR"];
export const APPROVER_ROLES = ["IT_ADMIN", "DIRECTOR"];

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!ADMIN_ROLES.includes(user.role)) redirect("/dashboard");
  return user;
}

export function isApprover(role?: string) {
  return APPROVER_ROLES.includes(role ?? "");
}

export function roleLabel(role: string) {
  return (
    {
      USER: "Colaborador",
      RECEPTION: "Recepção",
      IT_ADMIN: "TI / Admin",
      DIRECTOR: "Diretoria",
    }[role] ?? role
  );
}
