import { NextResponse } from "next/server";
import { complaintsRepo } from "@/lib/repositories/complaints";

/** تتبّع برقم مرجعي — يعيد المعرّف فقط، لا محتوى البلاغ. */
export async function GET(request: Request) {
  const ref = new URL(request.url).searchParams.get("ref")?.trim();
  if (!ref) return NextResponse.json({ error: "missing_ref" }, { status: 400 });

  const complaint = complaintsRepo.byRef(ref);
  if (!complaint) return NextResponse.json({ id: null }, { status: 404 });

  return NextResponse.json({ id: complaint.id });
}
