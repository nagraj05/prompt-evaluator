"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X, BookmarkPlus, Check } from "lucide-react";
import type { OpenRouterModel } from "@/lib/openrouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

  const [baseSearch, setBaseSearch] = useState("");
  const [baseOpen, setBaseOpen] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);

  const [compSearch, setCompSearch] = useState("");
  const [compOpen, setCompOpen] = useState(false);
  const compRef = useRef<HTMLDivElement>(null);

  const [providerFilter, setProviderFilter] = useState("all");
  const [contextFilter, setContextFilter] = useState(0);
  const [costTier, setCostTier] = useState<"all" | "free" | "paid">("all");

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
    onComparisonChange(preset.modelIds.filter((id) => id !== preset.baseModelId));
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
    return <p className="text-sm text-destructive">Failed to load models: {error}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-lg bg-muted/50 border">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider shrink-0 mr-1">
          Filters
        </span>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          disabled={loading}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
        >
          <option value="all">All providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={contextFilter}
          onChange={(e) => setContextFilter(Number(e.target.value))}
          disabled={loading}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
        >
          {CONTEXT_OPTIONS.map((o) => (
            <option key={o.min} value={o.min}>{o.label}</option>
          ))}
        </select>

        <div className="flex rounded-md border border-input overflow-hidden text-xs">
          {(["all", "free", "paid"] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setCostTier(tier)}
              className={cn(
                "px-2.5 h-7 capitalize transition-colors",
                costTier === tier
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Preset bar */}
      {presets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider shrink-0">
            Presets
          </span>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => loadPreset(p)}
              className="text-xs rounded-full border border-input px-3 py-1 bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Model selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Base Model */}
        <div className="flex flex-col gap-2">
          <Label>Base model</Label>
          <div ref={baseRef} className="relative">
            <button
              type="button"
              onClick={() => setBaseOpen((o) => !o)}
              disabled={loading}
              className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-accent/50 transition-colors disabled:opacity-50"
            >
              <span className={cn(baseModel ? "text-foreground" : "text-muted-foreground")}>
                {loading ? "Loading models…" : baseModel ? baseModel.name : "Select base model"}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
            </button>

            {baseOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
                <div className="p-2 border-b">
                  <Input
                    autoFocus
                    placeholder="Search models…"
                    value={baseSearch}
                    onChange={(e) => setBaseSearch(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <ul className="max-h-60 overflow-y-auto">
                  {filteredBase.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-muted-foreground text-center">No models found</li>
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
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between gap-2 transition-colors",
                            m.id === baseModelId && "text-primary font-medium"
                          )}
                        >
                          <span className="truncate">{m.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {m.isFree && <Badge variant="success" className="text-xs py-0">free</Badge>}
                            {m.id === baseModelId && <Check className="w-3.5 h-3.5 text-primary" />}
                          </div>
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
        <div className="flex flex-col gap-2">
          <Label>
            Comparison models{" "}
            {comparisonModelIds.length > 0 && (
              <span className="text-muted-foreground font-normal">
                ({comparisonModelIds.length} selected)
              </span>
            )}
          </Label>
          <div ref={compRef} className="relative">
            <button
              type="button"
              onClick={() => setCompOpen((o) => !o)}
              disabled={loading}
              className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-accent/50 transition-colors disabled:opacity-50"
            >
              <span className="text-muted-foreground truncate">
                {loading
                  ? "Loading models…"
                  : comparisonModelIds.length === 0
                  ? "Select comparison models"
                  : comparisonModelIds
                      .map((id) => models.find((m) => m.id === id)?.name ?? id)
                      .join(", ")}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
            </button>

            {compOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
                <div className="p-2 border-b flex gap-2 items-center">
                  <Input
                    autoFocus
                    placeholder="Search models…"
                    value={compSearch}
                    onChange={(e) => setCompSearch(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-xs text-primary hover:underline whitespace-nowrap shrink-0"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllFiltered}
                    className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
                  >
                    None
                  </button>
                </div>
                <ul className="max-h-60 overflow-y-auto">
                  {filteredComp.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-muted-foreground text-center">No models found</li>
                  ) : (
                    filteredComp.map((m) => {
                      const checked = comparisonModelIds.includes(m.id);
                      return (
                        <li key={m.id}>
                          <label className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleComparison(m.id)}
                              className="accent-primary"
                            />
                            <span className="truncate flex-1">{m.name}</span>
                            {m.isFree && <Badge variant="success" className="text-xs py-0 shrink-0">free</Badge>}
                          </label>
                        </li>
                      );
                    })
                  )}
                </ul>
                {comparisonModelIds.length > 0 && (
                  <div className="p-2 border-t">
                    <button
                      type="button"
                      onClick={() => onComparisonChange([])}
                      className="text-xs text-muted-foreground hover:text-foreground"
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
            <div className="flex flex-wrap gap-1.5">
              {comparisonModelIds.map((id) => {
                const name = models.find((m) => m.id === id)?.name ?? id;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs"
                  >
                    <span className="max-w-[140px] truncate">{name}</span>
                    <button
                      type="button"
                      onClick={() => toggleComparison(id)}
                      className="text-muted-foreground hover:text-foreground leading-none"
                      aria-label={`Remove ${name}`}
                    >
                      <X className="w-3 h-3" />
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSaveModalOpen(true)}
            className="text-xs text-muted-foreground"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Save as preset
          </Button>
        </div>
      )}

      {/* Save preset modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card text-card-foreground rounded-xl border shadow-xl p-6 w-80 flex flex-col gap-4">
            <h3 className="text-sm font-semibold">Save preset</h3>
            <Input
              autoFocus
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
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSaveModalOpen(false);
                  setPresetName("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={savePreset}
                disabled={!presetName.trim() || saving}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
