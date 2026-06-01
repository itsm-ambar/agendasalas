"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isApprover } from "@/lib/authz";
import { decideBooking } from "@/lib/bookings";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function decideBookingAction(bookingId: string, approve: boolean, note?: string) {
  const admin = await requireAdmin();
  if (!isApprover(admin.role)) {
    return { ok: false as const, error: "Apenas TI ou Diretoria podem aprovar reservas." };
  }
  const res = await decideBooking(bookingId, admin.id, approve, note);
  if (res.ok) {
    revalidatePath("/admin");
    revalidatePath("/admin/approvals");
    revalidatePath("/dashboard");
  }
  return res;
}

export async function upsertRoomAction(input: {
  id?: string;
  name: string;
  location?: string;
  capacity: number;
  description?: string;
  color: string;
  requiresApproval: boolean;
  active: boolean;
}) {
  await requireAdmin();
  if (!input.name.trim()) return { ok: false as const, error: "Informe o nome da sala." };

  const data = {
    name: input.name.trim(),
    location: input.location?.trim() || null,
    capacity: Math.max(1, Number(input.capacity) || 1),
    description: input.description?.trim() || null,
    color: input.color || "#FB0047",
    requiresApproval: !!input.requiresApproval,
    active: !!input.active,
  };

  try {
    if (input.id) {
      await prisma.room.update({ where: { id: input.id }, data });
    } else {
      let slug = slugify(input.name);
      const exists = await prisma.room.findUnique({ where: { slug } });
      if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
      await prisma.room.create({ data: { ...data, slug } });
    }
  } catch {
    return { ok: false as const, error: "Erro ao salvar a sala." };
  }
  revalidatePath("/admin/rooms");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function setUserRoleAction(userId: string, role: string) {
  const admin = await requireAdmin();
  if (admin.role !== "IT_ADMIN") {
    return { ok: false as const, error: "Apenas a TI pode alterar papéis." };
  }
  if (!["USER", "RECEPTION", "IT_ADMIN", "DIRECTOR"].includes(role)) {
    return { ok: false as const, error: "Papel inválido." };
  }
  await prisma.user.update({ where: { id: userId }, data: { role: role as never } });
  revalidatePath("/admin/users");
  return { ok: true as const };
}
