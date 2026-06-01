import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { ReservaApp } from "@/components/ReservaApp";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 60);

  const [rooms, bookings, my] = await Promise.all([
    prisma.room.findMany({
      where: { active: true },
      orderBy: [{ requiresApproval: "desc" }, { name: "asc" }],
    }),
    prisma.booking.findMany({
      where: { status: { in: ["CONFIRMED", "PENDING"] }, end: { gte: now }, start: { lte: horizon } },
      orderBy: { start: "asc" },
      select: { roomId: true, title: true, start: true, end: true, status: true },
    }),
    prisma.booking.findMany({
      where: { organizerId: user.id },
      orderBy: { start: "desc" },
      take: 50,
      include: { room: true, attendees: true },
    }),
  ]);

  return (
    <ReservaApp
      defaultEmail={user.email ?? ""}
      userName={user.name ?? null}
      rooms={rooms.map((r) => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        color: r.color,
        requiresApproval: r.requiresApproval,
        description: r.description,
      }))}
      bookings={bookings.map((b) => ({
        roomId: b.roomId,
        title: b.title,
        start: b.start.toISOString(),
        end: b.end.toISOString(),
        status: b.status,
      }))}
      myBookings={my.map((b) => ({
        id: b.id,
        title: b.title,
        roomName: b.room.name,
        roomColor: b.room.color,
        start: b.start.toISOString(),
        end: b.end.toISOString(),
        status: b.status,
        attendees: b.attendees.length,
        decisionNote: b.decisionNote,
      }))}
    />
  );
}
