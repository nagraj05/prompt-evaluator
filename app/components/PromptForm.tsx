"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ModelPicker } from "./ModelPicker";

export function PromptForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [baseModelId, setBaseModelId] = useState("");
  const [comparisonModelIds, setComparisonModelIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || !baseModelId || comparisonModelIds.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          systemPrompt:
            showSystemPrompt && systemPrompt.trim()
              ? systemPrompt.trim()
              : undefined,
          baseModelId,
          modelIds: comparisonModelIds,
        }),
      });

      if (!res.ok) {
        let message = `Request failed: ${res.status}`;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // empty body — use status message
        }
        throw new Error(message);
      }

      const { evaluationId } = (await res.json()) as { evaluationId: string };
      setPrompt("");
      setSystemPrompt("");
      setShowSystemPrompt(false);
      setBaseModelId("");
      setComparisonModelIds([]);
      setSubmitting(false);
      router.push(`/eval/${evaluationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const totalModels = comparisonModelIds.length + (baseModelId ? 1 : 0);
  const canSubmit =
    prompt.trim().length > 0 &&
    !!baseModelId &&
    comparisonModelIds.length > 0 &&
    !submitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Prompt */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          required
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt…"
          className="min-h-[140px]"
        />
      </div>

      {/* System prompt (collapsible) */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowSystemPrompt((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          {showSystemPrompt ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          System prompt <span className="text-xs">(optional)</span>
        </button>
        {showSystemPrompt && (
          <Textarea
            rows={3}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter a system prompt…"
          />
        )}
      </div>

      {/* Model picker */}
      <ModelPicker
        baseModelId={baseModelId}
        comparisonModelIds={comparisonModelIds}
        onBaseChange={setBaseModelId}
        onComparisonChange={setComparisonModelIds}
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit} size="lg">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : totalModels > 0 ? (
            `Compare across ${totalModels} model${totalModels === 1 ? "" : "s"}`
          ) : (
            "Compare models"
          )}
        </Button>
      </div>
    </form>
  );
}
