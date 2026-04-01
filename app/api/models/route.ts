import { cacheTag, cacheLife } from "next/cache";
import { fetchModels } from "@/lib/openrouter";
import { NextResponse } from "next/server";

async function getModels() {
  "use cache";
  cacheTag("openrouter-models");
  cacheLife("hours");
  return fetchModels();
}

export async function GET() {
  try {
    const models = await getModels();
    return NextResponse.json(models);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch models";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
