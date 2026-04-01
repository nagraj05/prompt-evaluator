import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { evaluations, responses } from "@/db/schema";
import { callModel } from "@/lib/openrouter";
import { uploadResponse } from "@/lib/blob";

type SSEEvent =
  | {
      type: "response";
      modelId: string;
      isBase: boolean;
      text: string;
      latencyMs: number;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    }
  | { type: "error"; modelId: string; message: string }
  | { type: "done" };

function encodeEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [evaluation] = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.id, id))
    .limit(1);

  if (!evaluation) {
    return new Response("Evaluation not found", { status: 404 });
  }

  const modelIds = evaluation.modelIds as string[];
  const baseModelId = evaluation.baseModelId;

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (e: SSEEvent) =>
        controller.enqueue(new TextEncoder().encode(encodeEvent(e)));

      const modelTasks = modelIds.map(async (modelId) => {
        try {
          const result = await callModel(
            modelId,
            evaluation.prompt,
            evaluation.systemPrompt
          );

          const isBase = modelId === baseModelId;

          // Persist to blob store
          let blobKey: string | null = null;
          try {
            blobKey = await uploadResponse(id, modelId, {
              modelId,
              prompt: evaluation.prompt,
              systemPrompt: evaluation.systemPrompt,
              ...result,
            });
          } catch {
            // Blob failure is non-fatal
          }

          // Persist to DB
          await db.insert(responses).values({
            evaluationId: id,
            modelId,
            isBase,
            text: result.text,
            latencyMs: result.latencyMs,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            costUsd: result.costUsd,
            blobKey,
          });

          encode({
            type: "response",
            modelId,
            isBase,
            text: result.text,
            latencyMs: result.latencyMs,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            costUsd: result.costUsd,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          encode({ type: "error", modelId, message });
        }
      });

      await Promise.allSettled(modelTasks);
      encode({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
