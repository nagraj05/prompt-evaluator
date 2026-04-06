"use client";

import { Loader2, AlertCircle, Clock, Coins } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

function formatLatency(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms.toLocaleString()}ms`;
}

export function ResponseCard({ modelId, isBase, state }: Props) {
  const provider = modelId.includes("/") ? modelId.split("/")[0] : "";
  const shortName = modelId.includes("/") ? modelId.split("/")[1] : modelId;

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isBase && (
                <Badge variant="default" className="text-xs shrink-0">Base</Badge>
              )}
              <span className="text-sm font-semibold truncate" title={modelId}>
                {shortName}
              </span>
            </div>
            {provider && (
              <p className="text-xs text-muted-foreground mt-0.5">{provider}</p>
            )}
          </div>
          <div className="shrink-0">
            {state.status === "waiting" && (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            )}
            {state.status === "error" && (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            {state.status === "done" && (
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 pb-4 min-h-[160px] max-h-[520px] overflow-y-auto">
        {state.status === "waiting" && (
          <p className="text-sm text-muted-foreground italic">Waiting for response…</p>
        )}
        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}
        {state.status === "done" && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{state.text}</p>
        )}
      </CardContent>

      {state.status === "done" && (
        <>
          <Separator />
          <CardFooter className="pt-3 pb-3 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatLatency(state.latencyMs)}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {state.inputTokens.toLocaleString()} in · {state.outputTokens.toLocaleString()} out
            </span>
            <span className="ml-auto font-medium text-foreground">
              {formatCost(state.costUsd)}
            </span>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
