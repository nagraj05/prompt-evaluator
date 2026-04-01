"use client";

export type ResponseState =
  | { status: "waiting" }
  | { status: "done"; text: string; latencyMs: number; inputTokens: number; outputTokens: number; costUsd: number }
  | { status: "error"; message: string };

interface Props {
  modelId: string;
  isBase: boolean;
  state: ResponseState;
}

function formatCost(usd: number) {
  if (usd === 0) return "free";
  if (usd < 0.001) return `$${(usd * 1000).toFixed(3)}m`;
  return `$${usd.toFixed(4)}`;
}

export function ResponseCard({ modelId, isBase, state }: Props) {
  const shortName = modelId.includes("/") ? modelId.split("/")[1] : modelId;

  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
        {isBase && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            base
          </span>
        )}
        <span className="text-sm font-medium truncate" title={modelId}>
          {shortName}
        </span>
        <span className="text-xs text-neutral-400 truncate hidden sm:block">
          {modelId.includes("/") ? modelId.split("/")[0] : ""}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4 min-h-[160px]">
        {state.status === "waiting" && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span className="inline-block w-4 h-4 border-2 border-neutral-300 border-t-blue-500 rounded-full animate-spin" />
            Waiting for response…
          </div>
        )}
        {state.status === "error" && (
          <p className="text-sm text-red-500">{state.message}</p>
        )}
        {state.status === "done" && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{state.text}</p>
        )}
      </div>

      {/* Footer — stats */}
      {state.status === "done" && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-400">
          <span>{state.latencyMs.toLocaleString()} ms</span>
          <span>{state.inputTokens.toLocaleString()} in</span>
          <span>{state.outputTokens.toLocaleString()} out</span>
          <span className="ml-auto">{formatCost(state.costUsd)}</span>
        </div>
      )}
    </div>
  );
}
