import "server-only";
import { prisma } from "@/lib/prisma";
import { sendInvite } from "@/lib/email";
import { BookingStatus } from "@prisma/client";

export type AttendeeInput = { email: string; name?: string };

/** Status que efetivamente "ocupam" um horário e geram conflito. */
const BLOCKING: BookingStatus[] = ["CONFIRMED", "PENDING"];

export async function hasConflict(
  roomId: string,
  start: Date,
  end: Date,
  ignoreBookingId?: string,
): Promise<boolean> {
  const overlap = await prisma.booking.findFirst({
    where: {
      roomId,
      id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
      status: { in: BLOCKING },
      // sobreposição: início < fim_existente E fim > início_existente
      start: { lt: end },
      end: { gt: start },
    },
    select: { id: true },
  });
  return !!overlap;
}

export type CreateBookingArgs = {
  roomId: string;
  organizerId: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendees: AttendeeInput[];
};

export async function createBooking(args: CreateBookingArgs) {
  if (args.end <= args.start) {
    return { ok: false as const, error: "O horário de término deve ser depois do início." };
  }
  if (args.start < new Date(Date.now() - 60_000)) {
    return { ok: false as const, error: "Não dá pra reservar um horário no passado." };
  }

  const room = await prisma.room.findUnique({ where: { id: args.roomId } });
  if (!room || !room.active) {
    return { ok: false as const, error: "Sala indisponível." };
  }

  if (await hasConflict(room.id, args.start, args.end)) {
    return { ok: false as const, error: "Já existe uma reserva nesse horário para esta sala." };
  }

  const status: BookingStatus = room.requiresApproval ? "PENDING" : "CONFIRMED";

  const cleanAttendees = dedupeAttendees(args.attendees);

  const booking = await prisma.booking.create({
    data: {
      roomId: room.id,
      organizerId: args.organizerId,
      title: args.title.trim(),
      description: args.description?.trim() || null,
      start: args.start,
      end: args.end,
      status,
      attendees: { create: cleanAttendees },
    },
    include: { room: true, organizer: true, attendees: true },
  });

  // Convites só saem quando a reserva está CONFIRMADA.
  if (status === "CONFIRMED") {
    await fireInvite(booking.id, "REQUEST");
  }

  return { ok: true as const, booking, pending: status === "PENDING" };
}

export async function decideBooking(
  bookingId: string,
  deciderId: string,
  approve: boolean,
  note?: string,
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false as const, error: "Reserva não encontrada." };
  if (booking.status !== "PENDING") {
    return { ok: false as const, error: "Esta reserva não está mais pendente." };
  }

  // Revalida conflito no momento da aprovação (alguém pode ter confirmado antes).
  if (approve && (await hasConflict(booking.roomId, booking.start, booking.end, booking.id))) {
    return { ok: false as const, error: "Conflito de horário: outra reserva ocupou o período." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: approve ? "CONFIRMED" : "REJECTED",
      decidedById: deciderId,
      decidedAt: new Date(),
      decisionNote: note?.trim() || null,
    },
  });

  if (approve) await fireInvite(bookingId, "REQUEST");
  return { ok: true as const };
}

export async function cancelBooking(bookingId: string, byUserId: string, isAdmin: boolean) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false as const, error: "Reserva não encontrada." };
  if (!isAdmin && booking.organizerId !== byUserId) {
    return { ok: false as const, error: "Você só pode cancelar suas próprias reservas." };
  }
  if (["CANCELLED", "REJECTED"].includes(booking.status)) {
    return { ok: false as const, error: "Reserva já encerrada." };
  }

  const wasConfirmed = booking.status === "CONFIRMED";
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

  // Se já havia convite enviado, manda o cancelamento de calendário.
  if (wasConfirmed) await fireInvite(bookingId, "CANCEL");
  return { ok: true as const };
}

// ---- helpers ----

async function fireInvite(bookingId: string, method: "REQUEST" | "CANCEL") {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true, organizer: true, attendees: true },
  });
  if (!b) return;

  if (method === "CANCEL") {
    // Se houver evento de calendário, remove; senão manda e-mail de cancelamento.
    if (b.calendarEventId) {
      const { deleteCalendarEvent } = await import("@/lib/graph-mail");
      await deleteCalendarEvent(b.organizer.email, b.calendarEventId);
    }
    await sendInvite({
      title: b.title,
      description: b.description,
      start: b.start,
      end: b.end,
      roomName: b.room.name,
      roomLocation: b.room.location,
      organizerName: b.organizer.name,
      organizerEmail: b.organizer.email,
      attendees: b.attendees.map((a) => ({ email: a.email, name: a.name })),
      method: "CANCEL",
    });
    return;
  }

  // REQUEST: tenta criar o evento no calendário do organizador (com Teams).
  const { createCalendarEvent } = await import("@/lib/graph-mail");
  const locationLabel = `${b.room.name}${b.room.location ? ` (${b.room.location})` : ""}`;
  const bodyHtml = `${b.description ? b.description + "<br><br>" : ""}Sala: <b>${b.room.name}</b><br>Reserva via Autodoc · Reserva de Salas.`;

  const evt = await createCalendarEvent({
    organizerEmail: b.organizer.email,
    subject: `${b.title} — ${b.room.name}`,
    bodyHtml,
    startUTC: b.start,
    endUTC: b.end,
    location: locationLabel,
    attendees: b.attendees.map((a) => ({ email: a.email, name: a.name })),
    withTeams: true,
  });

  if (evt.ok) {
    // Evento criado: a própria Microsoft envia os convites nativos (Aceitar/Recusar).
    await prisma.booking.update({
      where: { id: b.id },
      data: { calendarEventId: evt.eventId ?? null, teamsJoinUrl: evt.joinUrl ?? null },
    });
    return;
  }

  // Fallback: se a criação do evento falhar, manda o e-mail com .ics (que já funciona).
  console.warn("[booking] evento de calendário falhou, usando fallback de e-mail:", evt.detail);
  await sendInvite({
    title: b.title,
    description: b.description,
    start: b.start,
    end: b.end,
    roomName: b.room.name,
    roomLocation: b.room.location,
    organizerName: b.organizer.name,
    organizerEmail: b.organizer.email,
    attendees: b.attendees.map((a) => ({ email: a.email, name: a.name })),
    method: "REQUEST",
  });
}

function dedupeAttendees(list: AttendeeInput[]): { email: string; name?: string }[] {
  const seen = new Set<string>();
  const out: { email: string; name?: string }[] = [];
  for (const a of list) {
    const email = a.email.trim().toLowerCase();
    if (!email || seen.has(email) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;
    seen.add(email);
    out.push({ email, name: a.name?.trim() || undefined });
  }
  return out;
}
