import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { presets } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select()
    .from(presets)
    .orderBy(desc(presets.createdAt));
  return NextResponse.json(rows);
}

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  baseModelId: z.string().min(1),
  modelIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { name, baseModelId, modelIds } = parsed.data;

  const [preset] = await db
    .insert(presets)
    .values({ name, baseModelId, modelIds })
    .returning();

  return NextResponse.json(preset, { status: 201 });
}
