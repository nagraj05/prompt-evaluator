import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { evaluations } from "@/db/schema";
import { ComparisonGrid } from "@/components/ComparisonGrid";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EvalPage({ params }: Props) {
  const { id } = await params;

  const [evaluation] = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.id, id))
    .limit(1);

  if (!evaluation) notFound();

  const modelIds = evaluation.modelIds as string[];

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">Evaluation</h1>
          <Badge variant="outline" className="font-mono text-xs">
            {evaluation.id.slice(0, 8)}…
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(evaluation.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed">
          {evaluation.prompt}
        </div>

        {evaluation.systemPrompt && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground whitespace-pre-wrap">
            <span className="font-semibold text-foreground">System: </span>
            {evaluation.systemPrompt}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{modelIds.length} model{modelIds.length !== 1 ? "s" : ""}</span>
          <Separator orientation="vertical" className="h-3" />
          <span>Base: <span className="font-mono text-foreground">{evaluation.baseModelId}</span></span>
        </div>
      </div>

      <Separator />

      {/* Comparison grid */}
      <ComparisonGrid
        evaluationId={id}
        baseModelId={evaluation.baseModelId}
        modelIds={modelIds}
      />
    </div>
  );
}
