"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { createBooking, cancelBooking } from "@/lib/bookings";
import { rememberContact } from "@/lib/people";
import { combineDateTime } from "@/lib/format";

const TENANT_DOMAINS = ["autodoc.com.br", "ambar"];

/** Resolve um e-mail em um usuário do banco (cria se não existir). */
async function resolveOrganizer(email: string, name?: string) {
  const e = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return null;
  return prisma.user.upsert({
    where: { email: e },
    update: name ? { name } : {},
    create: { email: e, name: name?.trim() || e.split("@")[0], role: "USER" },
  });
}

type AdminCreateInput = {
  roomId: string;
  title: string;
  description?: string;
  dateStr: string;
  startTime: string;
  endTime: string;
  organizer: { email: string; name?: string };
  attendees: { email: string; name?: string }[];
};

export async function adminCreateBookingAction(input: AdminCreateInput) {
  await requireAdmin();

  const organizer = await resolveOrganizer(input.organizer.email, input.organizer.name);
  if (!organizer) return { ok: false as const, error: "Organizador inválido (e-mail incorreto)." };

  const start = combineDateTime(input.dateStr, input.startTime);
  const end = combineDateTime(input.dateStr, input.endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { ok: false as const, error: "Data ou horário inválidos." };
  }

  const res = await createBooking({
    roomId: input.roomId,
    organizerId: organizer.id,
    title: input.title,
    description: input.description,
    start,
    end,
    attendees: input.attendees.map((a) => ({ email: a.email, name: a.name })),
  });

  if (res.ok) {
    for (const a of input.attendees) {
      const isInternal = TENANT_DOMAINS.some((d) => a.email.toLowerCase().includes(d));
      if (!isInternal) await rememberContact(a.email, a.name);
    }
    revalidatePath("/admin/agenda");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
  }
  return {
    ok: res.ok,
    error: "error" in res ? res.error : undefined,
    pending: "pending" in res ? res.pending : false,
  };
}

export async function adminCancelBookingAction(bookingId: string) {
  const admin = await requireAdmin();
  const res = await cancelBooking(bookingId, admin.id, true);
  if (res.ok) {
    revalidatePath("/admin/agenda");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
  }
  return res;
}
