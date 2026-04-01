"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      router.push(`/eval/${evaluationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const totalModels =
    comparisonModelIds.length + (baseModelId ? 1 : 0);
  const canSubmit =
    prompt.trim().length > 0 &&
    !!baseModelId &&
    comparisonModelIds.length > 0 &&
    !submitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Prompt textarea */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="prompt" className="text-sm font-medium">
          Prompt
        </label>
        <textarea
          id="prompt"
          required
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt…"
          className="resize-y rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* System prompt (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowSystemPrompt((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-foreground transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform ${showSystemPrompt ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 6 10"
          >
            <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          System prompt (optional)
        </button>
        {showSystemPrompt && (
          <textarea
            rows={3}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter a system prompt…"
            className="mt-2 w-full resize-y rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting
            ? "Submitting…"
            : totalModels > 0
            ? `Compare across ${totalModels} model${totalModels === 1 ? "" : "s"}`
            : "Compare models"}
        </button>
      </div>
    </form>
  );
}
