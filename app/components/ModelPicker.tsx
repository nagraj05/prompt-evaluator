"use client";

import { useEffect, useRef, useState } from "react";
import type { OpenRouterModel } from "@/lib/openrouter";

type Props = {
  baseModelId: string;
  comparisonModelIds: string[];
  onBaseChange: (modelId: string) => void;
  onComparisonChange: (modelIds: string[]) => void;
};

type Preset = {
  id: string;
  name: string;
  baseModelId: string;
  modelIds: string[];
};

const CONTEXT_OPTIONS = [
  { label: "Any context", min: 0 },
  { label: "≥ 8K", min: 8_000 },
  { label: "≥ 32K", min: 32_000 },
  { label: "≥ 100K", min: 100_000 },
  { label: "≥ 200K", min: 200_000 },
];

export function ModelPicker({
  baseModelId,
  comparisonModelIds,
  onBaseChange,
  onComparisonChange,
}: Props) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Base model dropdown
  const [baseSearch, setBaseSearch] = useState("");
  const [baseOpen, setBaseOpen] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);

  // Comparison models dropdown
  const [compSearch, setCompSearch] = useState("");
  const [compOpen, setCompOpen] = useState(false);
  const compRef = useRef<HTMLDivElement>(null);

  // Filters (apply to both dropdowns)
  const [providerFilter, setProviderFilter] = useState("all");
  const [contextFilter, setContextFilter] = useState(0);
  const [costTier, setCostTier] = useState<"all" | "free" | "paid">("all");

  // Presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch models: ${r.status}`);
        return r.json() as Promise<OpenRouterModel[]>;
      })
      .then((data) => {
        setModels(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load models");
        setLoading(false);
      });

    fetch("/api/presets")
      .then((r) => r.json() as Promise<Preset[]>)
      .then(setPresets)
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (baseRef.current && !baseRef.current.contains(e.target as Node)) {
        setBaseOpen(false);
      }
      if (compRef.current && !compRef.current.contains(e.target as Node)) {
        setCompOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const providers = Array.from(new Set(models.map((m) => m.provider))).sort();

  function applyFilters(list: OpenRouterModel[]) {
    return list.filter((m) => {
      if (providerFilter !== "all" && m.provider !== providerFilter) return false;
      if (m.contextLength < contextFilter) return false;
      if (costTier === "free" && !m.isFree) return false;
      if (costTier === "paid" && m.isFree) return false;
      return true;
    });
  }

  const filteredBase = applyFilters(models).filter(
    (m) =>
      m.name.toLowerCase().includes(baseSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(baseSearch.toLowerCase())
  );

  const filteredComp = applyFilters(models).filter(
    (m) =>
      m.name.toLowerCase().includes(compSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(compSearch.toLowerCase())
  );

  const baseModel = models.find((m) => m.id === baseModelId);

  function toggleComparison(modelId: string) {
    if (comparisonModelIds.includes(modelId)) {
      onComparisonChange(comparisonModelIds.filter((id) => id !== modelId));
    } else {
      onComparisonChange([...comparisonModelIds, modelId]);
    }
  }

  function selectAllFiltered() {
    const ids = filteredComp.map((m) => m.id);
    onComparisonChange(Array.from(new Set([...comparisonModelIds, ...ids])));
  }

  function deselectAllFiltered() {
    const filteredIds = new Set(filteredComp.map((m) => m.id));
    onComparisonChange(comparisonModelIds.filter((id) => !filteredIds.has(id)));
  }

  function loadPreset(preset: Preset) {
    onBaseChange(preset.baseModelId);
    onComparisonChange(
      preset.modelIds.filter((id) => id !== preset.baseModelId)
    );
  }

  async function savePreset() {
    if (!presetName.trim() || !baseModelId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName.trim(),
          baseModelId,
          modelIds: [baseModelId, ...comparisonModelIds],
        }),
      });
      if (res.ok) {
        const newPreset = (await res.json()) as Preset;
        setPresets((p) => [newPreset, ...p]);
        setSaveModalOpen(false);
        setPresetName("");
      }
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">Failed to load models: {error}</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-neutral-400 font-medium uppercase tracking-wide shrink-0">
          Filters
        </span>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          disabled={loading}
          className="rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs outline-none disabled:opacity-50"
        >
          <option value="all">All providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={contextFilter}
          onChange={(e) => setContextFilter(Number(e.target.value))}
          disabled={loading}
          className="rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs outline-none disabled:opacity-50"
        >
          {CONTEXT_OPTIONS.map((o) => (
            <option key={o.min} value={o.min}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden text-xs">
          {(["all", "free", "paid"] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setCostTier(tier)}
              className={`px-2.5 py-1 capitalize transition-colors ${
                costTier === tier
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-white dark:bg-neutral-900 text-neutral-500 hover:text-foreground"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Preset bar */}
      {presets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-400 font-medium uppercase tracking-wide shrink-0">
            Presets
          </span>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => loadPreset(p)}
              className="text-xs rounded-full border border-neutral-200 dark:border-neutral-700 px-2.5 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Model selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Base Model */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Base model</label>
          <div ref={baseRef} className="relative">
            <button
              type="button"
              onClick={() => setBaseOpen((o) => !o)}
              className="w-full flex items-center justify-between rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-left"
              disabled={loading}
            >
              <span className={baseModel ? "" : "text-neutral-400"}>
                {loading
                  ? "Loading models…"
                  : baseModel
                  ? baseModel.name
                  : "Select base model"}
              </span>
              <ChevronDown />
            </button>

            {baseOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg">
                <div className="p-2 border-b border-neutral-100 dark:border-neutral-800">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search models…"
                    value={baseSearch}
                    onChange={(e) => setBaseSearch(e.target.value)}
                    className="w-full rounded border border-neutral-200 dark:border-neutral-700 bg-transparent px-2 py-1 text-sm outline-none"
                  />
                </div>
                <ul className="max-h-60 overflow-y-auto">
                  {filteredBase.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-neutral-400">
                      No models found
                    </li>
                  ) : (
                    filteredBase.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onBaseChange(m.id);
                            setBaseSearch("");
                            setBaseOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between gap-2 ${
                            m.id === baseModelId
                              ? "text-blue-600 dark:text-blue-400 font-medium"
                              : ""
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          {m.isFree && (
                            <span className="shrink-0 text-xs text-green-600 dark:text-green-400">
                              free
                            </span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Models */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Comparison models{" "}
            {comparisonModelIds.length > 0 && (
              <span className="text-neutral-400 font-normal">
                ({comparisonModelIds.length} selected)
              </span>
            )}
          </label>
          <div ref={compRef} className="relative">
            <button
              type="button"
              onClick={() => setCompOpen((o) => !o)}
              className="w-full flex items-center justify-between rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-left"
              disabled={loading}
            >
              <span className="text-neutral-400 truncate">
                {loading
                  ? "Loading models…"
                  : comparisonModelIds.length === 0
                  ? "Select comparison models"
                  : comparisonModelIds
                      .map((id) => models.find((m) => m.id === id)?.name ?? id)
                      .join(", ")}
              </span>
              <ChevronDown />
            </button>

            {compOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg">
                <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 flex gap-2 items-center">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search models…"
                    value={compSearch}
                    onChange={(e) => setCompSearch(e.target.value)}
                    className="flex-1 rounded border border-neutral-200 dark:border-neutral-700 bg-transparent px-2 py-1 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllFiltered}
                    className="text-xs text-neutral-500 hover:text-foreground whitespace-nowrap"
                  >
                    None
                  </button>
                </div>
                <ul className="max-h-60 overflow-y-auto">
                  {filteredComp.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-neutral-400">
                      No models found
                    </li>
                  ) : (
                    filteredComp.map((m) => {
                      const checked = comparisonModelIds.includes(m.id);
                      return (
                        <li key={m.id}>
                          <label className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleComparison(m.id)}
                              className="accent-blue-600"
                            />
                            <span className="truncate flex-1">{m.name}</span>
                            {m.isFree && (
                              <span className="shrink-0 text-xs text-green-600 dark:text-green-400">
                                free
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })
                  )}
                </ul>
                {comparisonModelIds.length > 0 && (
                  <div className="p-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => onComparisonChange([])}
                      className="text-xs text-neutral-500 hover:text-foreground"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected tags */}
          {comparisonModelIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {comparisonModelIds.map((id) => {
                const name = models.find((m) => m.id === id)?.name ?? id;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs"
                  >
                    <span className="max-w-[140px] truncate">{name}</span>
                    <button
                      type="button"
                      onClick={() => toggleComparison(id)}
                      className="text-neutral-400 hover:text-foreground leading-none"
                      aria-label={`Remove ${name}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Save as preset */}
      {baseModelId && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setSaveModalOpen(true)}
            className="text-xs text-neutral-500 hover:text-foreground transition-colors"
          >
            + Save as preset
          </button>
        </div>
      )}

      {/* Save preset modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 w-80 shadow-xl">
            <h3 className="text-sm font-semibold mb-3">Save preset</h3>
            <input
              autoFocus
              type="text"
              placeholder="Preset name…"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") savePreset();
                if (e.key === "Escape") {
                  setSaveModalOpen(false);
                  setPresetName("");
                }
              }}
              className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setSaveModalOpen(false);
                  setPresetName("");
                }}
                className="px-3 py-1.5 text-sm text-neutral-500 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePreset}
                disabled={!presetName.trim() || saving}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      className="w-4 h-4 shrink-0 text-neutral-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
