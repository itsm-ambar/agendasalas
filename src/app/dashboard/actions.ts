"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/authz";
import { ADMIN_ROLES } from "@/lib/authz";
import { createBooking, cancelBooking } from "@/lib/bookings";
import { combineDateTime } from "@/lib/format";

type CreateInput = {
  roomId: string;
  title: string;
  description?: string;
  dateStr: string;
  startTime: string;
  endTime: string;
  attendees: string[];
};

export async function createBookingAction(input: CreateInput) {
  const user = await requireUser();

  const start = combineDateTime(input.dateStr, input.startTime);
  const end = combineDateTime(input.dateStr, input.endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { ok: false as const, error: "Data ou horário inválidos." };
  }

  const res = await createBooking({
    roomId: input.roomId,
    organizerId: user.id,
    title: input.title,
    description: input.description,
    start,
    end,
    attendees: input.attendees.map((email) => ({ email })),
  });

  if (res.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/admin/approvals");
  }
  return { ok: res.ok, error: "error" in res ? res.error : undefined, pending: "pending" in res ? res.pending : false };
}

export async function cancelBookingAction(bookingId: string) {
  const user = await requireUser();
  const isAdmin = ADMIN_ROLES.includes(user.role);
  const res = await cancelBooking(bookingId, user.id, isAdmin);
  if (res.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/admin");
  }
  return res;
}
