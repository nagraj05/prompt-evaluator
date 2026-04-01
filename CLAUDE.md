@AGENTS.md

# Project: Prompt Evaluator

A full-stack app that takes a user prompt, runs it against a base model + N comparison models via OpenRouter, and displays results in a real-time comparison grid.

## Tech Stack
- **Runtime**: Bun
- **Framework**: Next.js 16, App Router only (no Pages Router)
- **DB**: Neon (Postgres) via `@neondatabase/serverless` + Drizzle ORM
- **Blob**: Vercel Blob (`@vercel/blob`) — stores full response JSON payloads
- **AI Gateway**: OpenRouter (OpenAI-compatible API at `https://openrouter.ai/api/v1`)
- **Styling**: Tailwind CSS 4

## Key Decisions
- No authentication (open, single-user)
- Single server-side `OPENROUTER_API_KEY` — never exposed to client
- User picks 1 **base model** + N **comparison models** before submitting
- Grid layout — base model card pinned first, comparison cards alongside
- No auto-scoring or ranking — purely visual comparison
- Store only **final completed response text** (no token-level streaming history)
- Named model **presets** — save/load sets of base + comparison models
- Parallel model calls via `Promise.allSettled` in the SSE stream handler

## Environment Variables (`.env.local`)
```
DATABASE_URL=              # Neon Postgres connection string
OPENROUTER_API_KEY=        # OpenRouter key
BLOB_READ_WRITE_TOKEN=     # Vercel Blob read/write token
```

## DB Schema (`src/db/schema.ts`)
- `presets` — id, name, base_model_id, model_ids (jsonb), timestamps
- `evaluations` — id, prompt, system_prompt, base_model_id, model_ids (jsonb), created_at
- `responses` — id, evaluation_id, model_id, is_base, text, latency_ms, input_tokens, output_tokens, cost_usd, blob_key, created_at

## API Routes
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/models` | OpenRouter model list, cached 6h |
| POST | `/api/evaluate` | Create evaluation, return `evaluationId` |
| GET | `/api/evaluate/[id]/stream` | SSE — runs all models in parallel, emits per-model results |
| GET | `/api/presets` | List saved presets |
| POST | `/api/presets` | Save new preset |
| DELETE | `/api/presets/[id]` | Delete preset |
| GET | `/api/history` | List past evaluations |

## SSE Event Shape (`/api/evaluate/[id]/stream`)
```ts
{ type: "response", modelId, isBase, text, latencyMs, inputTokens, outputTokens, costUsd }
{ type: "error", modelId, message }
{ type: "done" }
```

## File Structure
```
app/
  layout.tsx                        # Nav: "New Evaluation" | "History"
  page.tsx                          # Home — PromptForm
  eval/[id]/page.tsx                # Comparison grid view
  history/page.tsx                  # Past evaluations
  api/models/route.ts
  api/evaluate/route.ts
  api/evaluate/[id]/stream/route.ts
  api/presets/route.ts
  api/presets/[id]/route.ts
  api/history/route.ts
src/
  db/client.ts                      # Neon DB singleton
  db/schema.ts                      # Drizzle schema
  lib/env.ts                        # Zod env validation (throws on missing vars)
  lib/openrouter.ts                 # callModel() + fetchModels()
  lib/blob.ts                       # uploadResponse() / getResponse() via Vercel Blob
  components/
    PromptForm.tsx
    ModelPicker.tsx
    PresetManager.tsx
    ComparisonGrid.tsx
    ResponseCard.tsx
```

## Implementation Progress
- [x] Phase 1 — Foundation (schema, DB client, env validation, layout)
- [x] Phase 2 — OpenRouter integration (model fetch, evaluate endpoint, SSE stream, blob)
- [ ] Phase 3 — Core UI (PromptForm, ModelPicker, PresetManager, ComparisonGrid, ResponseCard)
- [ ] Phase 4 — History (history page, re-run, serve from DB for completed evals)
- [ ] Phase 5 — Polish (keyboard shortcuts, copy, export, error states)

## Next.js 16 — Important Notes
- Use `use cache` directive + `cacheTag()` / `cacheLife()` instead of `unstable_cache` (deprecated)
- Enable `cacheComponents: true` in `next.config.ts` to use `use cache`
- Route Handler dynamic params: `{ params }: { params: Promise<{ id: string }> }` — must `await params`
- Always read `node_modules/next/dist/docs/` before using any Next.js API
