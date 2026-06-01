import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchPeople } from "@/lib/people";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ people: [] }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q") ?? "";
  const people = await searchPeople(q);
  return NextResponse.json({ people });
}
