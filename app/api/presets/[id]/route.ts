import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { presets } from "@/db/schema";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const deleted = await db
    .delete(presets)
    .where(eq(presets.id, id))
    .returning({ id: presets.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
