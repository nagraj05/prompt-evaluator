import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { evaluations } from "@/db/schema";
import Link from "next/link";

export default async function HistoryPage() {
  const rows = await db
    .select()
    .from(evaluations)
    .orderBy(desc(evaluations.createdAt))
    .limit(50);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-10 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">History</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No evaluations yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden">
          {rows.map((ev) => {
            const modelIds = ev.modelIds as string[];
            return (
              <Link
                key={ev.id}
                href={`/eval/${ev.id}`}
                className="flex flex-col gap-1 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <p className="text-sm line-clamp-2 text-foreground">
                  {ev.prompt}
                </p>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                  <span>{new Date(ev.createdAt).toLocaleString()}</span>
                  <span>·</span>
                  <span>{modelIds.length} model{modelIds.length !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span className="font-mono truncate max-w-[180px]">{ev.baseModelId}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
