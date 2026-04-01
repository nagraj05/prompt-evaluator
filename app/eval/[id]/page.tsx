import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { evaluations } from "@/db/schema";
import { ComparisonGrid } from "@/components/ComparisonGrid";

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
    <div className="max-w-7xl mx-auto w-full px-4 py-10 flex flex-col gap-6">
      {/* Prompt summary */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Evaluation</h1>
        <p className="text-sm text-neutral-500 font-mono break-all">{evaluation.id}</p>
        <div className="mt-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 text-sm whitespace-pre-wrap">
          {evaluation.prompt}
        </div>
        {evaluation.systemPrompt && (
          <div className="mt-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 text-xs text-neutral-500 whitespace-pre-wrap">
            <span className="font-medium">System:</span> {evaluation.systemPrompt}
          </div>
        )}
      </div>

      {/* Comparison grid — client component handles SSE */}
      <ComparisonGrid
        evaluationId={id}
        baseModelId={evaluation.baseModelId}
        modelIds={modelIds}
      />
    </div>
  );
}
