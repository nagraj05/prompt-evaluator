import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { evaluations } from "@/db/schema";

const bodySchema = z.object({
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  baseModelId: z.string().min(1),
  modelIds: z.array(z.string().min(1)).min(1),
  presetId: z.string().optional(),
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

  const { prompt, systemPrompt, baseModelId, modelIds } = parsed.data;

  // Ensure baseModelId is included in modelIds (it will be called too)
  const allModelIds = Array.from(new Set([baseModelId, ...modelIds]));

  const [evaluation] = await db
    .insert(evaluations)
    .values({
      prompt,
      systemPrompt: systemPrompt ?? null,
      baseModelId,
      modelIds: allModelIds,
    })
    .returning({ id: evaluations.id });

  return NextResponse.json({ evaluationId: evaluation.id }, { status: 201 });
}
