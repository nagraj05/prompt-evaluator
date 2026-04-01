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

## DB Schema (`app/db/schema.ts`)
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
  eval/[id]/page.tsx                # Comparison grid view (server component → ComparisonGrid)
  history/page.tsx                  # Past evaluations (Phase 4)
  api/
    models/route.ts                 # OpenRouter model list, cached 6h
    evaluate/route.ts               # POST — create evaluation row
    evaluate/[id]/stream/route.ts   # GET SSE — parallel model calls, store to DB + Blob
    presets/route.ts                # GET list / POST create
    presets/[id]/route.ts           # DELETE
    history/route.ts                # GET list (Phase 4)
  db/
    client.ts                       # neon() + drizzle(neon-http) singleton
    schema.ts                       # Drizzle schema (presets, evaluations, responses)
  lib/
    env.ts                          # Zod env validation (throws on missing vars)
    openrouter.ts                   # callModel() + fetchModels()
    blob.ts                         # uploadResponse() / getResponse() via Vercel Blob
  components/
    PromptForm.tsx                  # Prompt + system prompt + ModelPicker + submit
    ModelPicker.tsx                 # Base/comparison picker with filters, presets bar, save modal
    ComparisonGrid.tsx              # SSE client, drives ResponseCard per model
    ResponseCard.tsx                # waiting / done / error card with stats footer
    PresetManager.tsx               # (Phase 3 remaining — load/save/delete presets standalone)
scripts/
  migrate.ts                        # One-shot HTTP migration (workaround for WSL/drizzle-kit bug)
```

## Implementation Progress
- [x] Phase 1 — Foundation (schema, DB client, env validation, layout)
- [x] Phase 2 — OpenRouter integration (model fetch, evaluate endpoint, SSE stream, blob)
- [x] Phase 3 — Core UI (PromptForm, ModelPicker, ComparisonGrid, ResponseCard, eval page)
- [ ] Phase 4 — History (history page, re-run, serve from DB for completed evals)
- [ ] Phase 5 — Polish (keyboard shortcuts, copy, export, error states)

## Critical Gotchas (learned the hard way)
- **Path alias**: `tsconfig.json` maps `@/*` → `./app/*` (NOT `./src/*` or `./`). All imports use this.
- **Drizzle driver**: Use `drizzle-orm/neon-http` with `neon()` HTTP client. Do NOT use `drizzle-orm/neon-serverless` — driver mismatch causes silent 500s with no console output.
- **drizzle-kit push hangs on WSL**: WebSocket driver blocks indefinitely. Use `scripts/migrate.ts` instead: `bun --env-file=.env.local scripts/migrate.ts`
- **Dynamic route params**: Always `await params` — `{ params }: { params: Promise<{ id: string }> }`
- **NeonDbError**: Extract message via `e.detail ?? e.code ?? e.message` — `e.sourceError` is always undefined.

## Next.js 16 — Important Notes
- Use `use cache` directive + `cacheTag()` / `cacheLife()` instead of `unstable_cache` (deprecated)
- Enable `cacheComponents: true` in `next.config.ts` to use `use cache`
- Route Handler dynamic params: `{ params }: { params: Promise<{ id: string }> }` — must `await params`
- Always read `node_modules/next/dist/docs/` before using any Next.js API
