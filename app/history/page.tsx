import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { evaluations } from "@/db/schema";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ClockIcon } from "lucide-react";

export default async function HistoryPage() {
  const rows = await db
    .select()
    .from(evaluations)
    .orderBy(desc(evaluations.createdAt))
    .limit(50);

  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your last {rows.length > 0 ? Math.min(rows.length, 50) : ""} evaluations.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <ClockIcon className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No evaluations yet.</p>
          <Link href="/" className="text-sm text-primary hover:underline">
            Run your first evaluation →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
          {rows.map((ev) => {
            const modelIds = ev.modelIds as string[];
            const provider = ev.baseModelId.includes("/")
              ? ev.baseModelId.split("/")[0]
              : ev.baseModelId;

            return (
              <Link
                key={ev.id}
                href={`/eval/${ev.id}`}
                className="group flex items-start gap-4 px-5 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <p className="text-sm font-medium line-clamp-2 leading-snug">
                    {ev.prompt}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {new Date(ev.createdAt).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <Badge variant="secondary" className="text-xs py-0">
                      {modelIds.length} model{modelIds.length !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline" className="text-xs py-0 font-mono">
                      {provider}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
