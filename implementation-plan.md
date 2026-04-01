# Implementation Plan — Prompt Evaluator

## Core Flow (reference for all phases)
```
User types prompt
  → picks base model (1)
  → picks comparison models (N)
  → optionally saves preset
  → clicks Submit

POST /api/evaluate
  → creates DB record
  → fires parallel OpenRouter calls (base + comparisons)
  → returns evaluationId

Browser connects to GET /api/evaluate/[id]/stream (SSE)
  → as each model finishes, server emits { modelId, text, latency, tokens, cost }
  → grid cards update live

On all models done → write final responses + blobs to DB
```

---

## Phase 1 — Foundation
> Runnable skeleton: DB, env config, layout, basic routing.

### Tasks
- [ ] **1.1** Install dependencies
  ```bash
  bun add @neondatabase/serverless drizzle-orm openai zod
  bun add -d drizzle-kit
  ```
- [ ] **1.2** Create `.env.local` with all required vars (see tech-stack.md)
- [ ] **1.3** Env validation at startup — `src/lib/env.ts` (Zod parse, throws if missing)
- [ ] **1.4** Drizzle schema — `src/db/schema.ts`
  - `presets` — id, name, base_model_id, model_ids (jsonb), created_at, updated_at
  - `evaluations` — id, prompt, system_prompt, base_model_id, model_ids (jsonb), created_at
  - `responses` — id, evaluation_id, model_id, is_base (bool), text, latency_ms, input_tokens, output_tokens, cost_usd, blob_key, created_at
- [ ] **1.5** Neon DB client singleton — `src/db/client.ts`
- [ ] **1.6** Run `bunx drizzle-kit push` to create tables
- [ ] **1.7** Root layout (`app/layout.tsx`) — minimal nav: "New Evaluation" | "History"
- [ ] **1.8** `drizzle.config.ts` wired to `DATABASE_URL`

---

## Phase 2 — OpenRouter Integration
> Fetch models, call models in parallel, stream results back via SSE.

### Tasks
- [ ] **2.1** OpenRouter client — `src/lib/openrouter.ts`
  - Init `openai` SDK with `baseURL: https://openrouter.ai/api/v1` and `OPENROUTER_API_KEY`
  - `callModel(modelId, prompt, systemPrompt, opts) → Promise<ModelResult>` (non-streaming, await full response)
  - `ModelResult` type: `{ modelId, text, latency_ms, input_tokens, output_tokens, cost_usd }`
- [ ] **2.2** Route Handler: `GET /api/models` — `app/api/models/route.ts`
  - Fetches `https://openrouter.ai/api/v1/models`
  - Cached 6h with `unstable_cache` + `cacheTag('openrouter-models')`
  - Returns: `id, name, provider (split from id), context_length, pricing`
- [ ] **2.3** Route Handler: `POST /api/evaluate` — `app/api/evaluate/route.ts`
  - Body: `{ prompt, systemPrompt?, baseModelId, modelIds[], presetId? }`
  - Validates with Zod
  - Inserts `evaluations` row, returns `{ evaluationId }`
  - Does NOT block — model calls happen in the SSE stream handler
- [ ] **2.4** Route Handler: `GET /api/evaluate/[id]/stream` — `app/api/evaluate/[id]/stream/route.ts`
  - Returns `text/event-stream` response
  - Fetches evaluation row from DB
  - Fires `Promise.allSettled` across all models (base + comparisons)
  - Each model call: on complete → emit SSE event → write response row to DB → upload blob
  - SSE event shape: `{ type: 'response', modelId, isBase, text, latency_ms, input_tokens, output_tokens, cost_usd }`
  - On all settled: emit `{ type: 'done' }` and close stream
  - On individual model error: emit `{ type: 'error', modelId, message }`
- [ ] **2.5** Neon Blob Store helper — `src/lib/blob.ts`
  - `uploadResponse(evaluationId, modelId, payload: object) → Promise<string>` (returns blob key)
  - `getResponse(blobKey) → Promise<object>`

---

## Phase 3 — Core UI
> Prompt form with model picker, grid comparison view, live streaming updates.

### Tasks
- [ ] **3.1** Home page — `app/page.tsx`
  - Renders `<PromptForm />` centered
- [ ] **3.2** `PromptForm` component — `src/components/PromptForm.tsx`
  - Prompt textarea (required)
  - Collapsible system prompt field
  - `<ModelPicker />` embedded below
  - Submit: POST `/api/evaluate` → on success navigate to `/eval/[id]`
- [ ] **3.3** `ModelPicker` component — `src/components/ModelPicker.tsx`
  - Fetches `/api/models` on mount
  - Step 1: "Choose base model" — searchable dropdown, single select
  - Step 2: "Choose comparison models" — searchable list grouped by provider, multi-select
  - Filter bar: provider filter, context window filter, cost tier (free/paid)
  - Select all / deselect all within a filtered group
  - Preset bar: load a saved preset (populates base + comparisons), save current selection as new preset
  - Emits `{ baseModelId, modelIds[] }` to parent
- [ ] **3.4** Preset manager — `src/components/PresetManager.tsx`
  - `GET /api/presets` → list saved presets
  - Load: fills ModelPicker with saved base + model IDs
  - Save: modal with name input → `POST /api/presets`
  - Delete: `DELETE /api/presets/[id]`
- [ ] **3.5** Route Handlers for presets
  - `GET /api/presets` — list all
  - `POST /api/presets` — create `{ name, baseModelId, modelIds[] }`
  - `DELETE /api/presets/[id]` — delete
- [ ] **3.6** Evaluation page — `app/eval/[id]/page.tsx`
  - Reads evaluation row from DB (base model + model list)
  - Renders `<ComparisonGrid evaluationId modelIds baseModelId />`
- [ ] **3.7** `ComparisonGrid` component — `src/components/ComparisonGrid.tsx`
  - Opens SSE connection to `/api/evaluate/[id]/stream`
  - Maintains state map: `modelId → { status, text, metrics }`
  - On `response` event → update card state
  - On `done` event → close SSE
  - Renders CSS grid: base model card first/pinned, comparison cards fill remaining columns
- [ ] **3.8** `ResponseCard` component — `src/components/ResponseCard.tsx`
  - Props: `{ model, isBase, status, text, latency_ms, tokens, cost_usd }`
  - States: `waiting` (skeleton pulse), `streaming` (spinner + partial text), `done` (full text + metrics), `error`
  - Badge: "Base Model" on the base card
  - Footer: latency | tokens | ~$cost

---

## Phase 4 — History
> Browse and re-run past evaluations.

### Tasks
- [ ] **4.1** Route Handler: `GET /api/history` — `app/api/history/route.ts`
  - Returns evaluations ordered by `created_at DESC`, with aggregated `total_cost_usd`, `response_count`
- [ ] **4.2** History page — `app/history/page.tsx`
  - Table/list of past evaluations: prompt preview (truncated), base model, model count, date, total cost
  - Each row links to `/eval/[id]`
  - "Re-run" button: navigates to home page pre-filled with same prompt + model selection
- [ ] **4.3** Evaluation page handles already-complete evaluations
  - If all responses exist in DB → render directly from DB (no SSE needed)
  - If evaluation is in-progress → connect to SSE as normal

---

## Phase 5 — Polish & UX
> Hardening, empty states, keyboard shortcuts, copy actions.

### Tasks
- [ ] **5.1** Keyboard shortcut: `Cmd/Ctrl + Enter` submits the prompt form
- [ ] **5.2** Copy response text button on each `ResponseCard`
- [ ] **5.3** Export evaluation as Markdown (prompt + all responses) — download button on eval page
- [ ] **5.4** Empty state on history page: "No evaluations yet — run your first prompt"
- [ ] **5.5** Error boundary on eval page (model stream errors shown inline, not page crash)
- [ ] **5.6** Responsive grid: 1 col on mobile, 2 col on tablet, auto-fill on desktop
- [ ] **5.7** Show total estimated cost for the evaluation in the page header as responses come in
- [ ] **5.8** Model count badge on submit button: "Compare across 12 models"

---

## File Structure
```
app/
  layout.tsx
  page.tsx                          # Home — prompt form
  eval/[id]/
    page.tsx                        # Comparison grid view
  history/
    page.tsx                        # Past evaluations
  api/
    models/route.ts                 # GET  /api/models
    evaluate/route.ts               # POST /api/evaluate
    evaluate/[id]/stream/route.ts   # GET  /api/evaluate/[id]/stream (SSE)
    presets/route.ts                # GET, POST /api/presets
    presets/[id]/route.ts           # DELETE /api/presets/[id]
    history/route.ts                # GET  /api/history

src/
  db/
    client.ts                       # Neon DB singleton
    schema.ts                       # Drizzle schema (4 tables)
  lib/
    env.ts                          # Zod env validation
    openrouter.ts                   # OpenRouter client + callModel()
    blob.ts                         # Neon Blob helpers
  components/
    PromptForm.tsx
    ModelPicker.tsx
    PresetManager.tsx
    ComparisonGrid.tsx
    ResponseCard.tsx

drizzle.config.ts
```
