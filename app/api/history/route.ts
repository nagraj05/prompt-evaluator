import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { evaluations } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select()
    .from(evaluations)
    .orderBy(desc(evaluations.createdAt))
    .limit(50);

  return NextResponse.json(rows);
}
