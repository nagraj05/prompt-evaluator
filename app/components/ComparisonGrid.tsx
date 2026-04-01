"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ResponseCard, type ResponseState } from "./ResponseCard";

interface ModelEntry {
  modelId: string;
  isBase: boolean;
}

interface Props {
  evaluationId: string;
  baseModelId: string;
  modelIds: string[]; // all model ids including base
}

export function ComparisonGrid({ evaluationId, baseModelId, modelIds }: Props) {
  const [states, setStates] = useState<Record<string, ResponseState>>(() => {
    const init: Record<string, ResponseState> = {};
    for (const id of modelIds) init[id] = { status: "waiting" };
    return init;
  });
  const [done, setDone] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/evaluate/${evaluationId}/stream`);

    es.onmessage = (e) => {
      const event = JSON.parse(e.data as string) as
        | { type: "response"; modelId: string; isBase: boolean; text: string; latencyMs: number; inputTokens: number; outputTokens: number; costUsd: number }
        | { type: "error"; modelId: string; message: string }
        | { type: "done" };

      if (event.type === "response") {
        setStates((prev) => ({
          ...prev,
          [event.modelId]: {
            status: "done",
            text: event.text,
            latencyMs: event.latencyMs,
            inputTokens: event.inputTokens,
            outputTokens: event.outputTokens,
            costUsd: event.costUsd,
          },
        }));
      } else if (event.type === "error") {
        setStates((prev) => ({
          ...prev,
          [event.modelId]: { status: "error", message: event.message },
        }));
      } else if (event.type === "done") {
        setDone(true);
        es.close();
      }
    };

    es.onerror = () => {
      setStreamError("Connection to stream lost.");
      es.close();
    };

    return () => es.close();
  }, [evaluationId]);

  const entries: ModelEntry[] = [
    { modelId: baseModelId, isBase: true },
    ...modelIds.filter((id) => id !== baseModelId).map((id) => ({ modelId: id, isBase: false })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {streamError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {streamError}
        </div>
      )}
      {done && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border rounded-lg px-4 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          All responses received.
        </div>
      )}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(({ modelId, isBase }) => (
          <ResponseCard
            key={modelId}
            modelId={modelId}
            isBase={isBase}
            state={states[modelId] ?? { status: "waiting" }}
          />
        ))}
      </div>
    </div>
  );
}
