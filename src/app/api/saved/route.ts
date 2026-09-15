import { NextResponse } from "next/server";
import { savedRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import type { SavedItem } from "@/lib/types";

const VALID_TYPES = new Set(["news", "service", "course"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = (await request.json().catch(() => null)) as
    | { entityType?: string; entityId?: string }
    | null;

  if (!body?.entityType || !body.entityId || !VALID_TYPES.has(body.entityType)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const saved = savedRepo.toggle(
    user.id,
    body.entityType as SavedItem["entityType"],
    body.entityId,
  );
  return NextResponse.json({ saved });
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ items: savedRepo.forUser(user.id) });
}
